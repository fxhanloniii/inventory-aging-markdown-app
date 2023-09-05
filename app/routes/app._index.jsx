// Import necessary dependencies
import { useEffect, useState } from "react";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Page, Layout, Text, VerticalStack, Card, List, Select } from "@shopify/polaris";
import { authenticate } from "../shopify.server";


// Helper function to poll the bulk operation status
async function pollOperationStatus(admin, operationId) {
  while (true) {
    const operationQuery = `
      query {
        node(id: "${operationId}") {
          ... on BulkOperation {
            id
            status
          }
        }
      }
    `;
    
    const response = await admin.graphql(operationQuery);
    const data = await response.json();
    const status = data.data.node.status;
    
    if (status === "COMPLETED") {
      return true; // Bulk operation completed
    } else if (status === "FAILED" || status === "CANCELLED") {
      throw new Error(`Bulk operation failed or was cancelled. Status: ${status}`);
    }
    
    // Wait before polling again
    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for 5 seconds
  }
}

// Loader function to authenticate and fetch product information
export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  

  
  // Construct the GraphQL query with variables
  const bulkOperationMutation = `
  mutation {
    bulkOperationRunQuery(
      query: """
        {
          products {
            edges {
              node {
                id
                title
                variants(first: 100) {  
                  edges {
                    node {
                      sku
                      inventoryQuantity
                      updatedAt
                    }
                  }
                }
              }
            }
          }
  
          orders {
            edges {
              node {
                id
                lineItems(first: 10) {
                  edges {
                    node {
                      sku
                      product {
                        id
                      }
                    }
                  }
                }
                createdAt
              }
            }
          }
        }
      """
    ) {
      bulkOperation {
        id
        status
      }
      userErrors {
        field
        message
      }
    }
  }
`;

// Start the bulk operation using your GraphQL client
const startOperationResponse = await admin.graphql(bulkOperationMutation);
  console.log("startedOperation")
  

  // Process the response data
  const data = await startOperationResponse.json();
  // Implement your own data processing logic here
  console.log("Errors:",data.data.bulkOperationRunQuery.userErrors);
  console.log("ID:",data.data.bulkOperationRunQuery.bulkOperation.id);

  console.log(data.data)
  
  const operationId = data.data.bulkOperationRunQuery.bulkOperation.id;
  
  // Poll the operation status
  try {
    await pollOperationStatus(admin, operationId);
  } catch (error) {
    console.error("Error polling bulk operation status:", error);
    return json({ error: "Error fetching bulk operation data" });
  }

  // Retrieve the URL for the JSONL file
  const operationQuery = `
    query {
      node(id: "${operationId}") {
        ... on BulkOperation {
          url
        }
      }
    }
  `;
  
  const urlResponse = await admin.graphql(operationQuery);
  const urlData = await urlResponse.json();
  const dataUrl = urlData.data.node.url;

  // Fetch and process the JSONL data
  const jsonDataResponse = await fetch(dataUrl);
  const jsonDataText = await jsonDataResponse.text();
  const jsonDataLines = jsonDataText.split('\n');

  const parsedData = jsonDataLines
    .filter(line => line.trim() !== '') // Remove empty lines
    .map(line => JSON.parse(line)); // Parse each JSON object in the line
  
    console.log("parsedData", parsedData);  
  return json({ operationStatus: "Completed", data: parsedData }); // Return the data to the loader
 

}


  




// Main component to render the page
export default function Index() {
  const { data } = useLoaderData(); // Get the product and order information from loader data
  
  // Define today's date and the date 30, 60 and 90 days ago
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  const [dropdownValue1, setDropdownValue1] = useState("30");
  
  // Define the aging buckets to store the products
  let agingBuckets = {
    30: [],
    60: [],
    90: [],
  };

  const orders = [];
  const products = [];

  data.forEach(item => {
    if (item.id && item.id.startsWith("gid://shopify/Order/")) {
      orders.push(item);
    } else {
      products.push(item);
    }
  });

  // Filter orders from the last 30 days
  const recentOrders = orders.filter(order => {
  const orderDate = new Date(order.createdAt);
  return orderDate > thirtyDaysAgo;
  });

  // Extract SKUs of products that have been ordered in the last 30 days
  const recentlyOrderedProductSkus = [];
  recentOrders.forEach(order => {
    if (lineItemsByOrder[order.id]) {
      lineItemsByOrder[order.id].forEach(item => {
        if (item.sku) {
          recentlyOrderedProductSkus.push(item.sku);
        }
      });
    }
  });
  console.log("recentOrders", recentlyOrderedProductSkus)

  // Filter products that have NOT been ordered in the last 30 days
  const productsNotOrderedRecently = products.filter(product => {
    return !recentlyOrderedProductSkus.includes(product.sku);
  });

 
  console.log("Orders:", orders);
  console.log("Products:", products);
  console.log("Not Ordered Recently:", productsNotOrderedRecently);

  function extractOrderLineItems(data) {
    // Filter out the order ids
    const orderIds = data.filter(item => item.id && item.id.startsWith('gid://shopify/Order/')).map(item => item.id);
    
    // For each order id, extract its line items
    const orderLineItems = {};
    orderIds.forEach(orderId => {
      orderLineItems[orderId] = data.filter(item => item.__parentId === orderId);
    });
  
    return orderLineItems;
  }
  const lineItemsByOrder = extractOrderLineItems(data);
  console.log("line items:", lineItemsByOrder);


  function extractOrderData(data, lineItemsByOrder) {
    // Extract orders with their created dates
    const orders = data.filter(item => item.id && item.id.startsWith('gid://shopify/Order/'))
                       .map(order => ({ id: order.id, createdAt: order.createdAt }));
    console.log("orders:", orders);
    const orderLineItems = {};

    orders.forEach(order => {
        orderLineItems[order.id] = {
            createdAt: order.createdAt,
            lineItems: lineItemsByOrder[order.id]
                          .filter(item => item.__parentId === order.id)
                          .map(item => {
                            if (item && item.product && item.product.id) {
                              return item.product.id;
                            } else {
                              return null; 
                            }
                          })
                          .filter(id => id), // Remove null values
        };
    });

    return orderLineItems;
}
console.log("orderLineItems:", extractOrderData(data, lineItemsByOrder));

function getProductsNotSoldInPeriod(data) {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    const sixtyDaysAgo = new Date(today);
    sixtyDaysAgo.setDate(today.getDate() - 60);
    
    const ninetyDaysAgo = new Date(today);
    ninetyDaysAgo.setDate(today.getDate() - 90);

    const productsByAging = {
        last30Days: new Set(),
        last60Days: new Set(),
        last90Days: new Set()
    };

    const orderData = extractOrderData(data, lineItemsByOrder);

    for (let orderId in orderData) {
        const orderDate = new Date(orderData[orderId].createdAt);
        orderData[orderId].lineItems.forEach(productId => {
          if (orderDate <= thirtyDaysAgo && orderDate > sixtyDaysAgo) {
            productsByAging.last30Days.add(productId);  // sold between 30-60 days ago
          }
          if (orderDate <= sixtyDaysAgo && orderDate > ninetyDaysAgo) {
              productsByAging.last60Days.add(productId);  // sold between 60-90 days ago
          }
          if (orderDate <= ninetyDaysAgo) {
              productsByAging.last90Days.add(productId);  // not sold for more than 90 days
          }
        });
    }

      return {
        soldBetween30And60Days: [...productsByAging.last30Days],
        soldBetween60And90Days: [...productsByAging.last60Days],
        notSoldForMoreThan90Days: [...productsByAging.last90Days]
      };
  }

const result = getProductsNotSoldInPeriod(data);

agingBuckets[30] = result.soldBetween30And60Days;
agingBuckets[60] = result.soldBetween60And90Days;
agingBuckets[90] = result.notSoldForMoreThan90Days;
console.log(result);
console.log(agingBuckets[30]);
console.log(agingBuckets[60]);
console.log(agingBuckets[90]);

  // New Code until SKUs come into play

  // After defining your constants `thirtyDaysAgo`, `sixtyDaysAgo`, and `ninetyDaysAgo`, create the following functions:

// function getOrderedProductIdsWithinDate(orders, date) {
//   return orders.reduce((acc, order) => {
//     const orderDate = new Date(order.createdAt);
//     if (orderDate > date) {
//       order.lineItems.edges.forEach(edge => {
//         acc.add(edge.node.product.id);
//       });
//     }
//     return acc;
//   }, new Set());  // We use a set to prevent duplicates
// }

// const orderedProductIdsInLast30Days = getOrderedProductIdsWithinDate(orders, thirtyDaysAgo);
// const orderedProductIdsInLast60Days = getOrderedProductIdsWithinDate(orders, sixtyDaysAgo);
// const orderedProductIdsInLast90Days = getOrderedProductIdsWithinDate(orders, ninetyDaysAgo);

// Now, for each aging bucket, filter the products:

// products.forEach(product => {
//   if (!orderedProductIdsInLast30Days.has(product.id)) {
//     agingBuckets[30].push(product);
//   } else if (!orderedProductIdsInLast60Days.has(product.id)) {
//     agingBuckets[60].push(product);
//   } else if (!orderedProductIdsInLast90Days.has(product.id)) {
//     agingBuckets[90].push(product);
//   }
// });

// Your products are now sorted in the `agingBuckets` based on the last time they were ordered.

// When rendering the products, use the value from the dropdown to determine which bucket to use:

const bucketToDisplay = agingBuckets[dropdownValue1];  // assuming dropdownValue1 contains values "30", "60", or "90"

 

  
  

  
if (!data) {
  return <p>Loading Data...</p>
}

  return (
    <Page>
      <ui-title-bar title="Inventory Aging Markdown"></ui-title-bar>
      <Layout.Section>
        <Card>
          <VerticalStack gap="5" >
            <Text as="h2" variant="headingMd">
              Dropdown 1
            </Text>
            <Select
              label="Select an option"
              options={[
                { label: "30 days", value: "30" },
                { label: "60 days", value: "60" },
                { label: "90 days", value: "90" },
                { label: "n.a", value: "n.a" },
              ]}
              value={dropdownValue1}
              onChange={setDropdownValue1}
            />
            <Select
              label="Select an option"
              options={[
                { label: "10%", value: "30" },
                { label: "20%", value: "60" },
                { label: "30%", value: "90" },
                { label: "n.a", value: "n.a" },
              ]}
              value={dropdownValue1}
              onChange={setDropdownValue1}
            />
          </VerticalStack>
        </Card>
      </Layout.Section>
      <VerticalStack gap="5">
        <Layout>
          <Layout.Section>
            <Card>
              <VerticalStack gap="5">
                <Text as="h2" variant="headingMd">
                  List of Products
                </Text>
                <List spacing="extraTight">
                {products.map(product => (
                  product.updatedAt && (
                    <Card key={product.id}>
                      <Text as="p">{product.title}</Text>
                      <Text as="p">SKU: {product.sku}</Text>
                      <Text as="p">Inventory Quantity: {product.inventoryQuantity}</Text>
                      <Text as="p">Updated At: {product.updatedAt}</Text>
                    </Card>
                  )
                ))}
                </List>
              </VerticalStack>
            </Card>
          </Layout.Section>
        </Layout>
      </VerticalStack>
    </Page>
  );
}
