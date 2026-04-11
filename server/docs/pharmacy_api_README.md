# Pharmacy API Documentation (Medication Inventory + Pharmacy Orders)

Base URL: `http://localhost:8081`

Summary
- Route groups covered:
	- Medication Inventory (route base: /api/pharmacy/medications)
	- Pharmacy Orders (route base: /api/pharmacy/orders)
- Auth middleware used in code: `protect` and `allowRoles(...)`. Endpoints marked as requiring auth reflect the route middleware present.

---

## Authentication

- Middleware used: `protect` and `allowRoles(...)`.
- Common role values used: `pharmacy`, `PHARMACIST`, `patient`, `doctor`, `admin`, `superadmin`.
- Notes:
	- Inventory create/update/delete and batch management require authenticated pharmacist/pharmacy role.
	- Order creation from prescription allows `patient`, `doctor`, `pharmacy`, `admin`, `superadmin`.
	- Confirming orders / updating order items requires pharmacy/pharmacist roles.
	- Some GET endpoints are public (no auth middleware) in current code.

---

## Medication Inventory API

Route base: /api/pharmacy/medications

### 1) Health / Test
- Method: `GET`
- Endpoint: `/api/pharmacy/medications/test`
- Auth: Not required

Example:
```bash
curl -X GET http://localhost:8081/api/pharmacy/medications/test
```

Example response `200`:
```json
{ "ok": true }
```

### 2) Create Medication
- Method: `POST`
- Endpoint: `/api/pharmacy/medications`
- Auth: Required — `protect`, `allowRoles("pharmacy", "PHARMACIST")`
- Request body example:
```json
{
	"name": "Paracetamol",
	"brandName": "Acme",
	"strength": "500mg",
	"form": "tablet",
	"category": "Analgesic",
	"description": "Pain reliever",
	"unit": "tablet",
	"isActive": true
}
```

Example curl:
```bash
curl -X POST http://localhost:8081/api/pharmacy/medications \
	-H "Authorization: Bearer <token>" \
	-H "Content-Type: application/json" \
	-d '{ "name":"Paracetamol", "strength":"500mg", "form":"tablet" }'
```

Example response `201`:
```json
{
	"_id": "642a8f...abc",
	"name": "Paracetamol",
	"brandName": "Acme",
	"strength": "500mg",
	"form": "tablet",
	"category": "Analgesic",
	"description": "Pain reliever",
	"unit": "tablet",
	"isActive": true,
	"batches": [],
	"createdAt": "2026-04-10T00:00:00.000Z",
	"updatedAt": "2026-04-10T00:00:00.000Z",
	"totalQuantity": 0
}
```

### 3) Get All Medications
- Method: `GET`
- Endpoint: `/api/pharmacy/medications`
- Auth: Not required
- Query params:
	- `search` (optional) — text search on name, brandName, strength, category

Example:
```bash
curl -X GET "http://localhost:8081/api/pharmacy/medications?search=para"
```

Example response `200`:
```json
[
	{
		"_id": "642a8f...abc",
		"name": "Paracetamol",
		"strength": "500mg",
		"form": "tablet",
		"batches": [
			{
				"_id": "7f1a2b...",
				"batchNo": "BATCH-001",
				"expiryDate": "2027-01-01T00:00:00.000Z",
				"quantity": 100,
				"unitPrice": 0.5,
				"addedById": "user123",
				"addedByName": "Pharmacist A",
				"addedAt": "2026-04-01T00:00:00.000Z"
			}
		],
		"totalQuantity": 100
	}
]
```

### 4) Get Medication By ID
- Method: `GET`
- Endpoint: `/api/pharmacy/medications/:id`
- Auth: Not required

Example:
```bash
curl -X GET http://localhost:8081/api/pharmacy/medications/642a8f...abc
```

Example `200`: single medication object (see previous response)
Example `404`:
```json
{ "message": "Medication not found" }
```

### 5) Update Medication
- Method: `PUT`
- Endpoint: `/api/pharmacy/medications/:id`
- Auth: Required — `protect`, `allowRoles("pharmacy", "PHARMACIST")`
- Request body: partial updates allowed (example)
```json
{ "description": "Updated description", "isActive": false }
```

Example `200`: returns updated medication object
Example `404`:
```json
{ "message": "Medication not found" }
```

### 6) Delete Medication
- Method: `DELETE`
- Endpoint: `/api/pharmacy/medications/:id`
- Auth: Required — `protect`, `allowRoles("pharmacy", "PHARMACIST")`

Example success `200`:
```json
{ "message": "Medication deleted successfully" }
```

### 7) Add Batch to Medication
- Method: `POST`
- Endpoint: `/api/pharmacy/medications/:id/batches`
- Auth: Required — `protect`, `allowRoles("pharmacy", "PHARMACIST")`
- Request body (required fields):
```json
{
	"batchNo": "BATCH-002",
	"expiryDate": "2027-06-01",
	"quantity": 50,
	"unitPrice": 0.45
}
```

Behavior:
- If `batchNo` exists it increments quantity and updates expiry/unitPrice if provided.
- Added-by fields are derived from the authenticated actor (`req.user` / `req.admin`).

Example response `200`: returns updated medication with batches

### 8) Update Batch
- Method: `PUT`
- Endpoint: `/api/pharmacy/medications/:id/batches/:batchId`
- Auth: Required — `protect`, `allowRoles("pharmacy", "PHARMACIST")`
- Request body: any of `{ batchNo, expiryDate, quantity, unitPrice }`

Example response `200`: updated medication document

### 9) Delete Batch
- Method: `DELETE`
- Endpoint: `/api/pharmacy/medications/:id/batches/:batchId`
- Auth: Required — `protect`, `allowRoles("pharmacy", "PHARMACIST")`

Example response `200`: updated medication document (batch removed)

---

## Pharmacy Orders API

Route base: /api/pharmacy/orders

### 1) Health / Test
- Method: `GET`
- Endpoint: `/api/pharmacy/orders/test`
- Auth: Not required

Example response `200`:
```json
{ "ok": true }
```

### 2) Create Order (internal — pharmacy staff)
- Method: `POST`
- Endpoint: `/api/pharmacy/orders`
- Auth: Required — `protect`, `allowRoles("pharmacy", "PHARMACIST")`
- Request body example:
```json
{
	"patient": { "name": "John Doe", "email": "john@example.com", "phone": "+94771234567" },
	"prescriptionTextSnapshot": "Rx text or notes",
	"items": [
		{ "medicationId": "642a8f...abc", "qty": 10, "instructions": "Take after food" },
		{ "medicationId": "7b2c3d...fff", "qty": 2 }
	]
}
```

Behavior:
- Server will attempt to build a planned allocation for all items (FIFO by expiry).
- If all items available, transactionally deducts batch quantities and creates order with `status: "CONFIRMED"`, `items` containing `allocations` and `itemTotal`, `subtotal` and `total`.
- If any item shortage exists, returns waiting info (see below) and does NOT deduct stock in a confirmed order.

Example success `201` (confirmed order):
```json
{
	"_id": "60f1a2...",
	"orderNo": "PH-1617...-12345",
	"patient": { "name":"John Doe","email":"john@example.com","phone":"+94771234567" },
	"prescriptionTextSnapshot":"Rx text or notes",
	"status":"CONFIRMED",
	"items":[
		{
			"medicationId":"642a8f...abc",
			"requestedQty":10,
			"allocations":[
				{
					"batchId":"7f1a2b...",
					"batchNoSnapshot":"BATCH-001",
					"expiryDateSnapshot":"2027-01-01T00:00:00.000Z",
					"qty":10,
					"unitPriceSnapshot":0.5,
					"lineTotal":5.0
				}
			],
			"itemTotal":5.0
		}
	],
	"subtotal": 5.0,
	"total": 5.0,
	"confirmedAt": "2026-04-10T00:00:00.000Z"
}
```

Example waiting / shortage `200` (if shortages detected during planning):
```json
{
	"message": "Some items are currently waiting for stock",
	"waitingItems": [
		{
			"medicationId": "xxxx",
			"requestedQty": 10,
			"availableQty": 4,
			"shortageQty": 6,
			"instructions": "",
			"nameSnapshot": "Medication A"
		}
	],
	"status": "WAITING_STOCK"
}
```

### 3) Create Order From Prescription (patients can call)
- Method: `POST`
- Endpoint: `/api/pharmacy/orders/from-prescription`
- Auth: Required — `protect`, `allowRoles("patient", "doctor", "pharmacy", "admin", "superadmin")`
- Request body:
```json
{ "prescriptionId": "606d..." }
```

Behavior:
- Creates a bare WAITING_STOCK order with empty items so pharmacist can complete
	the order later.

Example `201`:
```json
{ "message": "Order placed", "order": { "_id":"...", "status":"WAITING_STOCK", "items":[], "subtotal":0 } }
```

### 4) Get Orders (list)
- Method: `GET`
- Endpoint: `/api/pharmacy/orders`
- Auth: Not required (current code returns all orders)

Example:
```bash
curl -X GET http://localhost:8081/api/pharmacy/orders
```

Example `200`:
```json
[ { "_id":"...", "orderNo":"PH-...", "status":"CONFIRMED", "subtotal":10, "createdAt":"..." } ]
```

### 5) Get Order By ID
- Method: `GET`
- Endpoint: `/api/pharmacy/orders/:id`
- Auth: Not required

Example success `200`: returns full order document (items, allocations, totals)
Example `404`:
```json
{ "message": "Order not found" }
```

### 6) Update Order (basic metadata)
- Method: `PUT`
- Endpoint: `/api/pharmacy/orders/:id`
- Auth: Required — `protect`, `allowRoles("pharmacy", "PHARMACIST")`

Notes:
- Route allows updates to patient info & prescription snapshot but explicitly prevents direct status changes to `CONFIRMED` here; confirmations should be done via `/:id/items`.

### 7) Update Order Items (pharmacist confirms allocations)
- Method: `PUT`
- Endpoint: `/api/pharmacy/orders/:id/items`
- Auth: Required — `protect`, `allowRoles("pharmacy", "PHARMACIST")`
- Request body (example `items` is an array with medication allocations requested by pharmacist; simple form accepted by controller:
```json
{
	"items": [
		{ "medicationId": "642a8f...abc", "qty": 5, "instructions": "Take twice daily" }
	],
	"prescriptionTextSnapshot": "Updated Rx snapshot (optional)",
	"patient": { "name":"John Doe" }
}
```

Behavior:
- The controller restores any previous allocations (re-incrementing batch quantities stored on the inventory), builds a new planned allocation for all provided items, checks shortages.
- If this order was created from a Prescription, pharmacist must provide allocations for ALL prescribed medicines; otherwise order remains `WAITING_STOCK`.
- If shortages exist, the order remains `WAITING_STOCK` and saved with `waitingItems`. If all items covered, it applies deductions transactionally and sets `status` to `CONFIRMED`, saves allocations, updates `subtotal`/`total`.
- On success the confirmed order is returned and an invoice email is attempted (non-blocking).

---

## Schemas / Important Fields (summary)

- Medication document:
	- `name` (string, required), `brandName`, `strength` (required), `form` (enum), `category`, `description`, `unit`, `isActive` (boolean)
	- `batches`: array of `{ _id, batchNo, expiryDate, quantity, unitPrice, addedById, addedByName, addedAt }`
	- Virtual: `totalQuantity` (sum of batch quantities)

- PharmacyOrder document:
	- `orderNo` (string, unique), `patient` (name, email, phone), `prescriptionTextSnapshot` (string), `prescriptionId` (optional)
	- `status`: `"CONFIRMED"` | `"WAITING_STOCK"` (default `"CONFIRMED"` in some flows, but orders created from prescriptions default `WAITING_STOCK`)
	- `items`: array of orderItem:
		- `medicationId`, `requestedQty`, `availableQty`, `shortageQty`, `instructions`, `nameSnapshot`, `strengthSnapshot`, `brandNameSnapshot`, `formSnapshot`, `unitSnapshot`, `allocations`, `itemTotal`
	- `allocations` within an item: `{ batchId, batchNoSnapshot, expiryDateSnapshot, qty, unitPriceSnapshot, lineTotal }`
	- `subtotal`, `total`, `confirmedAt`

---

## Example Error Responses

- Validation error (400):
```json
{
	"message": "Validation failed",
	"errors": []
}
```

- Not found (404):
```json
{ "message": "Medication not found" }
```
or
```json
{ "message": "Order not found" }
```

- Business rule / shortage (200 with waiting info) — controller returns structured waiting info:
```json
{
	"waiting": true,
	"waitingInfo": {
		"waitingItems": [ /* items with availableQty/shortageQty */ ],
		"shortageTotal": 7
	}
}
```

- Server error (500):
```json
{ "message": "<error message>" }
```

---

## Implementation Notes & Behaviors

- Batch allocation strategy: FIFO by earliest expiry (`sortBatchesFIFO`) — allocations take from earliest expiry batches first.
- Order creation flow:
	- Internal orders (staff) attempt to fully plan and confirm immediately if inventory allows.
	- Orders created from prescriptions result in `WAITING_STOCK` and empty `items` for pharmacist to complete.
- `updateOrderItems` performs:
	1. Restore previous deductions (re-increment batch quantities for previous allocations).
	2. Build new plan (collect shortages if any).
	3. If all available, apply deductions transactionally and set order to `CONFIRMED`.
	4. If shortages remain, save waiting items and keep order `WAITING_STOCK`.
- Email: confirmed orders attempt to send invoice email via `sendInvoiceEmail` (non-blocking — failure does not roll back DB transaction).
- All inventory updates and order-confirmation deduction logic are run inside Mongoose sessions/transactions where code uses `startSession()` and `session`.

---