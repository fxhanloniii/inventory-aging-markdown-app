// Import necessary dependencies
import { useEffect, useState } from "react";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Page, Layout, Text, VerticalStack, Card, List, Select } from "@shopify/polaris";
import { authenticate } from "../shopify.server";

// Loader function to authenticate and fetch product information
export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

   // I need a bulk operation query, a webhook to check when operation is done and to display the information on the page

   
  



}

// Main component to render the page
export default function Index() {
  const { data } = useLoaderData(); // Get the product and order information from loader data
  console.log("data")
  useEffect(() => {
    if (data && data.products) {
      console.log("Product Data:", data.products.edges.node);
    }
  }, [data]);

    
    
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
      {/* <Layout.Section>
        <Card>
          <VerticalStack gap="5">
            <Text as="h2" variant="headingMd">
              Dropdown 2
            </Text>
            <Select
              label="Select an option"
              options={[
                { label: "30 days", value: "30" },
                { label: "60 days", value: "60" },
                { label: "90 days", value: "90" },
                { label: "n.a", value: "n.a" },
              ]}
              value={dropdownValue2}
              onChange={setDropdownValue2}
            />
          </VerticalStack>
        </Card>
      </Layout.Section>
      <Layout.Section>
        <Card>
          <VerticalStack gap="5">
            <Text as="h2" variant="headingMd">
              Dropdown 3
            </Text>
            <Select
              label="Select an option"
              options={[
                { label: "30 days", value: "30" },
                { label: "60 days", value: "60" },
                { label: "90 days", value: "90" },
                { label: "n.a", value: "n.a" },
              ]}
              value={dropdownValue3}
              onChange={setDropdownValue3}
            />
          </VerticalStack>
        </Card>
      </Layout.Section> */}
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
    </Page>
  );
}
