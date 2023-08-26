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
  
   // I need a bulk operation query, a webhook to check when operation is done and to display the information on the page

     // Define today's date and the date 30 days ago in the required format
  const today = new Date().toISOString().substring(0, 10);
  const thirtyDaysAgo = new Date(
    Date.now() - 30 * 24 * 60 * 60 * 1000
  ).toISOString().substring(0, 10);
  const url = 'https://fxhiii.myshopify.com/admin/api/2020-04/graphql.json';
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
          variants(first: 10) {  
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
  // Now you can parse and process the jsonData as needed
    console.log("parsedData", parsedData);  
  return json({ operationStatus: "Completed" }); // Return the data to the loader
 
  
}


  




// Main component to render the page
export default function Index() {
  const { operationStatus } = useLoaderData(); // Get the product and order information from loader data
  console.log("operationStatus", operationStatus);
  


 

  const [dropdownValue1, setDropdownValue1] = useState("30");
  const [dropdownValue2, setDropdownValue2] = useState("60");
  const [dropdownValue3, setDropdownValue3] = useState("90");

  

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
                { label: "30 days", value: "30" },
                { label: "60 days", value: "60" },
                { label: "90 days", value: "90" },
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
                
                </List>
              </VerticalStack>
            </Card>
          </Layout.Section>
        </Layout>
      </VerticalStack>
      <VerticalStack gap="5">
        <Layout>
          <Layout.Section>
            <Card>
              <VerticalStack gap="5">
                <Text as="h2" variant="headingMd">
                  List of Orders
                </Text>
                <List spacing="extraTight">
                
                </List>
              </VerticalStack>
            </Card>
          </Layout.Section>
        </Layout>
      </VerticalStack>
      <VerticalStack gap="5">
        <Layout>
          <Layout.Section>
            <Card>
              <VerticalStack gap="5">
                <Text as="h2" variant="headingMd">
                  List of Products
                </Text>
                <List spacing="extraTight">
                  {/* {jsonData.map(product => (
                    <List.Item key={product.id}>
                      <Card sectioned>
                        <Text>{product.title}</Text>
                        <Text>SKU: {product.sku}</Text>
                        <Text>Inventory Quantity: {product.inventoryQuantity}</Text>
                        <Text>Updated At: {product.updatedAt}</Text>
                      </Card>
                    </List.Item>
                  ))} */}
                </List>
              </VerticalStack>
            </Card>
          </Layout.Section>
        </Layout>
      </VerticalStack>

    </Page>
  );
}
