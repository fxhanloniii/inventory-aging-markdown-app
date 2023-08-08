// Import necessary dependencies
import { useEffect } from "react";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Page, Layout, Text, VerticalStack, Card, List } from "@shopify/polaris";
import { authenticate } from "../shopify.server";

// Loader function to authenticate and fetch product information
export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  // GraphQL query to fetch the first 10 products
  const response = await admin.graphql(`
    {
      products(first: 10) {
        edges {
          node {
            id
            title
            handle
          }
        }
      }
    }
  `);

  const responseJson = await response.json();

  return json({
    products: responseJson.data.products.edges.map(edge => edge.node),
  });
};

// Main component to render the page
export default function Index() {
  const { products } = useLoaderData(); // Get the product information from loader data

  return (
    <Page>
      <ui-title-bar title="Product Information"></ui-title-bar>
      <VerticalStack gap="5">
        <Layout>
          <Layout.Section>
            <Card>
              <VerticalStack gap="5">
                <Text as="h2" variant="headingMd">
                  List of Products
                </Text>
                <List spacing="extraTight">
                  {products.map((product) => (
                    <List.Item key={product.id}>
                      {product.title} (Handle: {product.handle})
                    </List.Item>
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
