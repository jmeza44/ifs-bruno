// Visual-only skeleton to validate the single-view layout proportions.
// Solid colors stand in for real components — no logic, no global state.

import { useState } from "react";
import { Group, Panel, Separator } from "react-resizable-panels";
import { CollectionSelector } from "@/components/workspace/collection-selector";
import {
  ProfileSelector,
  type ProfileOption,
} from "@/components/workspace/profile-selector";
import { NewProfileDialog } from "@/components/workspace/new-profile-dialog";
import { NewCollectionDialog } from "@/components/workspace/new-collection-dialog";
import {
  CollectionDetailsPanel,
  type CollectionDetails,
} from "@/components/workspace/collection-details-panel";
import {
  CollectionEndpointsTree,
  type CollectionFolder,
} from "@/components/workspace/collection-endpoints-tree";
import {
  SpecLoader,
  type LoadedSpec,
} from "@/components/workspace/spec-loader";
import {
  EndpointListPanel,
  type EndpointListEntry,
} from "@/components/workspace/endpoint-list-panel";
import {
  EndpointDetailPanel,
  type EndpointDetail,
} from "@/components/workspace/endpoint-detail-panel";
import type { CollectionEntry } from "@/lib/types";

const now = Date.now();

const MOCK_COLLECTIONS: CollectionEntry[] = [
  {
    path: "/home/jaime/collections/ifs-cloud-meco",
    name: "ifs-cloud-meco",
    baseHost: "https://meco-cfg.ifs.cloud/",
    endpointCount: 18,
    lastUsed: new Date(now - 2 * 60 * 60_000).toISOString(),
  },
  {
    path: "/home/jaime/collections/customer-orders-sandbox",
    name: "customer-orders-sandbox",
    baseHost: "https://qa-tenant.ifs.cloud/",
    endpointCount: 6,
    lastUsed: new Date(now - 3 * 24 * 60 * 60_000).toISOString(),
  },
];

const MOCK_COLLECTION_DETAILS: Record<string, CollectionDetails> = {
  "/home/jaime/collections/ifs-cloud-meco": {
    realm: "ifs-meco",
    clientId: "IFS_postman",
    keycloakBasePath: "/auth",
  },
  "/home/jaime/collections/customer-orders-sandbox": {
    realm: "qa-tenant",
    clientId: "IFS_postman",
    keycloakBasePath: "/auth",
  },
};

const MOCK_COLLECTION_FOLDERS: Record<string, CollectionFolder[]> = {
  "/home/jaime/collections/ifs-cloud-meco": [
    {
      name: "CustomerOrderHandling",
      endpoints: [
        {
          name: "Get customer orders",
          method: "GET",
          operationId: "getCustomerOrders",
        },
        {
          name: "Create customer order",
          method: "POST",
          operationId: "createCustomerOrder",
        },
        {
          name: "Update order line",
          method: "PATCH",
          operationId: "updateOrderLine",
        },
      ],
    },
    {
      name: "InventoryPartHandling",
      endpoints: [
        {
          name: "Get inventory parts",
          method: "GET",
          operationId: "getInventoryParts",
        },
        {
          name: "Delete inventory part",
          method: "DELETE",
          operationId: "deleteInventoryPart",
        },
      ],
    },
    {
      name: "Auth",
      endpoints: [
        { name: "Authenticate", method: "POST", operationId: "auth" },
      ],
    },
  ],
  "/home/jaime/collections/customer-orders-sandbox": [
    {
      name: "CustomerOrderHandling",
      endpoints: [
        {
          name: "Get customer orders",
          method: "GET",
          operationId: "getCustomerOrders",
        },
        {
          name: "Create customer order",
          method: "POST",
          operationId: "createCustomerOrder",
        },
      ],
    },
    {
      name: "Auth",
      endpoints: [
        { name: "Authenticate", method: "POST", operationId: "auth" },
      ],
    },
  ],
};

const MOCK_SPEC_ENDPOINTS: EndpointListEntry[] = [
  {
    id: "GET:/customer-orders",
    path: "/customer-orders",
    method: "GET",
    summary: "List customer orders",
    operationId: "getCustomerOrders",
  },
  {
    id: "POST:/customer-orders",
    path: "/customer-orders",
    method: "POST",
    summary: "Create a new customer order",
    operationId: "createCustomerOrder",
  },
  {
    id: "PATCH:/customer-orders/{orderId}/lines/{lineNo}",
    path: "/customer-orders/{orderId}/lines/{lineNo}",
    method: "PATCH",
    summary: "Update an order line",
    operationId: "updateOrderLine",
  },
  {
    id: "GET:/inventory-parts",
    path: "/inventory-parts",
    method: "GET",
    summary: "List inventory parts",
    operationId: "getInventoryParts",
  },
  {
    id: "DELETE:/inventory-parts/{partNo}",
    path: "/inventory-parts/{partNo}",
    method: "DELETE",
    summary: "Delete an inventory part",
    operationId: "deleteInventoryPart",
  },
  {
    id: "POST:/auth/token",
    path: "/auth/token",
    method: "POST",
    summary: "Authenticate and obtain a token",
    operationId: "auth",
  },
  {
    id: "PUT:/customer-orders/{orderId}/status",
    path: "/customer-orders/{orderId}/status",
    method: "PUT",
    summary: "Replace the status of a customer order",
    operationId: "setCustomerOrderStatus",
  },
];

const MOCK_ENDPOINT_DETAILS: Record<string, EndpointDetail> = {
  "GET:/customer-orders": {
    id: "GET:/customer-orders",
    path: "/customer-orders",
    method: "GET",
    operationId: "getCustomerOrders",
    summary: "List customer orders",
    description:
      "Returns a paginated list of customer orders for the active company.",
    tags: ["CustomerOrderHandling"],
    produces: ["application/json"],
    parameters: [
      {
        name: "company",
        in: "query",
        required: true,
        description: "Company id",
        type: "string",
        example: "MECO",
      },
      {
        name: "$top",
        in: "query",
        description: "Max number of records to return",
        type: "integer",
        example: 50,
      },
      {
        name: "$filter",
        in: "query",
        description: "OData filter expression",
        type: "string",
      },
      {
        name: "status",
        in: "query",
        description: "Filter by order status",
        type: "string",
        enum: ["Planned", "Released", "Closed", "Cancelled"],
      },
    ],
    responses: [
      {
        status: "200",
        description: "OK",
        schema: {
          type: "object",
          properties: {
            value: {
              type: "array",
              items: { $ref: "#/definitions/CustomerOrder" },
            },
            "@odata.count": { type: "integer" },
          },
        },
      },
      { status: "400", description: "Bad request" },
    ],
  },
  "POST:/customer-orders": {
    id: "POST:/customer-orders",
    path: "/customer-orders",
    method: "POST",
    operationId: "createCustomerOrder",
    summary: "Create a new customer order",
    tags: ["CustomerOrderHandling"],
    produces: ["application/json"],
    parameters: [
      {
        name: "body",
        in: "body",
        required: true,
        description: "Customer order payload",
        schema: {
          type: "object",
          properties: {
            CustomerNo: { type: "string" },
            OrderType: { type: "string" },
            Currency: { type: "string" },
            Lines: {
              type: "array",
              items: { $ref: "#/definitions/CustomerOrderLine" },
            },
          },
        },
      },
    ],
    responses: [
      {
        status: "201",
        description: "Created",
        schema: { $ref: "#/definitions/CustomerOrder" },
      },
      { status: "422", description: "Validation error" },
    ],
  },
  "PATCH:/customer-orders/{orderId}/lines/{lineNo}": {
    id: "PATCH:/customer-orders/{orderId}/lines/{lineNo}",
    path: "/customer-orders/{orderId}/lines/{lineNo}",
    method: "PATCH",
    operationId: "updateOrderLine",
    summary: "Update an order line",
    tags: ["CustomerOrderHandling"],
    produces: ["application/json"],
    parameters: [
      {
        name: "orderId",
        in: "path",
        required: true,
        description: "Customer order id",
        type: "string",
        example: "CO-10042",
      },
      {
        name: "lineNo",
        in: "path",
        required: true,
        description: "Order line number",
        type: "integer",
        example: 1,
      },
      {
        name: "body",
        in: "body",
        required: true,
        description: "Fields to update",
        schema: {
          type: "object",
          properties: {
            BuyQtyDue: { type: "number" },
            RequestedDeliveryDate: { type: "string", format: "date" },
          },
        },
      },
    ],
    responses: [
      {
        status: "200",
        description: "OK",
        schema: { $ref: "#/definitions/CustomerOrderLine" },
      },
      { status: "404", description: "Order line not found" },
    ],
  },
  "GET:/inventory-parts": {
    id: "GET:/inventory-parts",
    path: "/inventory-parts",
    method: "GET",
    operationId: "getInventoryParts",
    summary: "List inventory parts",
    tags: ["InventoryPartHandling"],
    produces: ["application/json"],
    parameters: [
      {
        name: "company",
        in: "query",
        required: true,
        description: "Company id",
        type: "string",
        example: "MECO",
      },
      {
        name: "$top",
        in: "query",
        description: "Max number of records to return",
        type: "integer",
        example: 50,
      },
    ],
    responses: [
      {
        status: "200",
        description: "OK",
        schema: {
          type: "object",
          properties: {
            value: {
              type: "array",
              items: { $ref: "#/definitions/InventoryPart" },
            },
          },
        },
      },
    ],
  },
  "DELETE:/inventory-parts/{partNo}": {
    id: "DELETE:/inventory-parts/{partNo}",
    path: "/inventory-parts/{partNo}",
    method: "DELETE",
    operationId: "deleteInventoryPart",
    summary: "Delete an inventory part",
    tags: ["InventoryPartHandling"],
    parameters: [
      {
        name: "partNo",
        in: "path",
        required: true,
        description: "Inventory part number",
        type: "string",
        example: "PART-001",
      },
    ],
    responses: [
      { status: "204", description: "No content" },
      { status: "404", description: "Part not found" },
    ],
  },
  "POST:/auth/token": {
    id: "POST:/auth/token",
    path: "/auth/token",
    method: "POST",
    operationId: "auth",
    summary: "Authenticate and obtain a token",
    tags: ["Auth"],
    produces: ["application/json"],
    parameters: [
      {
        name: "body",
        in: "body",
        required: true,
        description: "Client credentials",
        schema: {
          type: "object",
          properties: {
            grant_type: {
              type: "string",
              enum: ["client_credentials", "password"],
            },
            client_id: { type: "string" },
            client_secret: { type: "string" },
          },
        },
      },
    ],
    responses: [
      {
        status: "200",
        description: "OK",
        schema: {
          type: "object",
          properties: {
            access_token: { type: "string" },
            expires_in: { type: "integer" },
            token_type: { type: "string" },
          },
        },
      },
      { status: "401", description: "Unauthorized" },
    ],
  },
  "PUT:/customer-orders/{orderId}/status": {
    id: "PUT:/customer-orders/{orderId}/status",
    path: "/customer-orders/{orderId}/status",
    method: "PUT",
    operationId: "setCustomerOrderStatus",
    summary: "Replace the status of a customer order",
    tags: ["CustomerOrderHandling"],
    produces: ["application/json"],
    parameters: [
      {
        name: "orderId",
        in: "path",
        required: true,
        description: "Customer order id",
        type: "string",
        example: "CO-10042",
      },
      {
        name: "body",
        in: "body",
        required: true,
        description: "New status payload",
        schema: {
          type: "object",
          properties: {
            Status: {
              type: "string",
              enum: ["Planned", "Released", "Closed", "Cancelled"],
            },
          },
        },
      },
    ],
    responses: [
      { status: "200", description: "OK" },
      { status: "409", description: "Conflict" },
    ],
  },
};

const MOCK_ALREADY_IN_COLLECTION = new Set([
  "GET:/customer-orders",
  "POST:/customer-orders",
  "PATCH:/customer-orders/{orderId}/lines/{lineNo}",
]);

const MOCK_PROFILES: ProfileOption[] = [
  { id: "prof-1", name: "meco-cfg", environment: "https://meco-cfg.ifs.cloud" },
  { id: "prof-2", name: "qa-tenant", environment: "https://qa.ifs.cloud" },
];

export function WorkspaceLayoutSkeleton() {
  const [activeCollection, setActiveCollection] =
    useState<CollectionEntry | null>(MOCK_COLLECTIONS[0]);
  const [profiles, setProfiles] = useState(MOCK_PROFILES);
  const [activeProfile, setActiveProfile] = useState<ProfileOption | null>(
    MOCK_PROFILES[0],
  );
  const [loadedSpec, setLoadedSpec] = useState<LoadedSpec | null>(null);
  const [newProfileOpen, setNewProfileOpen] = useState(false);
  const [newCollectionOpen, setNewCollectionOpen] = useState(false);
  const [collections, setCollections] = useState(MOCK_COLLECTIONS);
  const [selectedToAdd, setSelectedToAdd] = useState<Set<string>>(new Set());
  const [activeEndpointId, setActiveEndpointId] = useState<string | null>(null);
  const activeEndpointDetail = activeEndpointId
    ? (MOCK_ENDPOINT_DETAILS[activeEndpointId] ?? null)
    : null;

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-border p-2">
        <CollectionSelector
          active={activeCollection}
          available={collections}
          onSelect={setActiveCollection}
          onCreateNew={() => setNewCollectionOpen(true)}
        />
        <NewCollectionDialog
          open={newCollectionOpen}
          onOpenChange={setNewCollectionOpen}
          onCreated={(path) => {
            const entry: CollectionEntry = {
              path,
              name: path.split(/[\\/]/).pop() ?? path,
              baseHost: null,
              endpointCount: 0,
              lastUsed: new Date().toISOString(),
            };
            setCollections((prev) => [...prev, entry]);
            setActiveCollection(entry);
          }}
        />
        <span className="text-sm font-semibold tracking-wide text-muted-foreground">
          IFS Bruno
        </span>
        <div className="flex gap-2">
          <ProfileSelector
            active={activeProfile}
            available={profiles}
            onSelect={setActiveProfile}
            onDelete={(profile) => {
              setProfiles((prev) => prev.filter((p) => p.id !== profile.id));
              if (activeProfile?.id === profile.id) setActiveProfile(null);
            }}
            onAddNew={() => setNewProfileOpen(true)}
          />
          <NewProfileDialog
            open={newProfileOpen}
            onOpenChange={setNewProfileOpen}
            onCreated={(name) =>
              setProfiles((prev) => [
                ...prev,
                { id: name, name, environment: "" },
              ])
            }
          />
          <SpecLoader
            loaded={loadedSpec}
            onLoad={(file) =>
              setLoadedSpec({
                fileName: file.name,
                projectionName: "CustomerOrderHandling",
              })
            }
            onClear={() => setLoadedSpec(null)}
          />
        </div>
      </div>

      {/* Canvas body */}
      <div className="min-h-0 flex-1 p-2 relative">
        <Group className="gap-x-2">
          {/* Main panel */}
          <Panel className="flex gap-2">
            <Group className="gap-x-2">
              <Panel defaultSize="30%" minSize="30%" maxSize="50%">
                <EndpointListPanel
                  entries={MOCK_SPEC_ENDPOINTS}
                  selected={selectedToAdd}
                  alreadyInCollection={MOCK_ALREADY_IN_COLLECTION}
                  activeId={activeEndpointId ?? undefined}
                  onToggleSelected={(id) =>
                    setSelectedToAdd((prev) => {
                      const next = new Set(prev);
                      if (next.has(id)) next.delete(id);
                      else next.add(id);
                      return next;
                    })
                  }
                  onViewDetail={(entry) => setActiveEndpointId(entry.id)}
                />
              </Panel>
              <Separator className="w-px bg-border transition-colors hover:bg-primary/50 data-active:bg-primary" />
              <Panel>
                <EndpointDetailPanel
                  endpoint={activeEndpointDetail}
                  selected={
                    activeEndpointId
                      ? selectedToAdd.has(activeEndpointId)
                      : false
                  }
                  alreadyInCollection={
                    activeEndpointId
                      ? MOCK_ALREADY_IN_COLLECTION.has(activeEndpointId)
                      : false
                  }
                  onToggleSelected={(id) =>
                    setSelectedToAdd((prev) => {
                      const next = new Set(prev);
                      if (next.has(id)) next.delete(id);
                      else next.add(id);
                      return next;
                    })
                  }
                />
              </Panel>
            </Group>
          </Panel>

          <Separator className="w-px bg-border transition-colors hover:bg-primary/50 data-active:bg-primary" />

          {/* Right sidebar — collapsible down to 0 */}
          <Panel defaultSize="20%" minSize="0%" maxSize="30%" collapsible>
            <div className="flex h-full flex-col gap-2">
              <div className="flex-initial overflow-hidden">
                <CollectionDetailsPanel
                  collection={activeCollection}
                  details={
                    activeCollection
                      ? (MOCK_COLLECTION_DETAILS[activeCollection.path] ?? null)
                      : null
                  }
                />
              </div>
              <div className="flex-2 overflow-hidden">
                <CollectionEndpointsTree
                  folders={
                    activeCollection
                      ? (MOCK_COLLECTION_FOLDERS[activeCollection.path] ?? [])
                      : []
                  }
                />
              </div>
            </div>
          </Panel>
        </Group>
      </div>
    </div>
  );
}
