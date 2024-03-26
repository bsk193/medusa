import { Modules } from "@medusajs/modules-sdk"
import { IOrderModuleService } from "@medusajs/types"
import { OrderStatus } from "@medusajs/utils"
import { SuiteOptions, moduleIntegrationTestRunner } from "medusa-test-utils"

jest.setTimeout(100000)

moduleIntegrationTestRunner({
  moduleName: Modules.ORDER,
  testSuite: ({ service }: SuiteOptions<IOrderModuleService>) => {
    describe("Order - Items and Shipping methods", () => {
      describe("create", () => {
        it("should throw an error when required params are not passed", async () => {
          const error = await service
            .create([
              {
                email: "test@email.com",
              } as any,
            ])
            .catch((e) => e)

          expect(error.message).toContain(
            "Value for Order.currency_code is required, 'undefined' found"
          )
        })

        it("should create an order successfully", async () => {
          const [createdOrder] = await service.create([
            {
              currency_code: "eur",
              items: [
                {
                  title: "test",
                  quantity: 1,
                  unit_price: 100,
                },
              ],
            },
          ])

          const [order] = await service.list({ id: [createdOrder.id] })

          expect(order).toEqual(
            expect.objectContaining({
              id: createdOrder.id,
              currency_code: "eur",
            })
          )
        })

        it("should create an order with billing + shipping address successfully", async () => {
          const [createdOrder] = await service.create([
            {
              currency_code: "eur",
              billing_address: {
                first_name: "John",
                last_name: "Doe",
              },
              shipping_address: {
                first_name: "John",
                last_name: "Doe",
              },
            },
          ])

          const [order] = await service.list(
            { id: [createdOrder.id] },
            { relations: ["billing_address", "shipping_address"] }
          )

          expect(order).toEqual(
            expect.objectContaining({
              id: createdOrder.id,
              currency_code: "eur",
              billing_address: expect.objectContaining({
                first_name: "John",
                last_name: "Doe",
              }),
              shipping_address: expect.objectContaining({
                first_name: "John",
                last_name: "Doe",
              }),
            })
          )
        })

        it("should create an order with billing id + shipping id successfully", async () => {
          const [createdAddress] = await service.createAddresses([
            {
              first_name: "John",
              last_name: "Doe",
            },
          ])

          const [createdOrder] = await service.create([
            {
              currency_code: "eur",
              billing_address_id: createdAddress.id,
              shipping_address_id: createdAddress.id,
            },
          ])

          expect(createdOrder).toEqual(
            expect.objectContaining({
              id: createdOrder.id,
              currency_code: "eur",
              billing_address: expect.objectContaining({
                id: createdAddress.id,
                first_name: "John",
                last_name: "Doe",
              }),
              shipping_address: expect.objectContaining({
                id: createdAddress.id,
                first_name: "John",
                last_name: "Doe",
              }),
            })
          )
        })

        it("should create an order with items", async () => {
          const createdOrder = await service.create({
            currency_code: "eur",
            items: [
              {
                title: "test",
                quantity: 1,
                unit_price: 100,
              },
            ],
          })

          const order = await service.retrieve(createdOrder.id, {
            relations: ["items.item"],
          })

          expect(order).toEqual(
            expect.objectContaining({
              id: createdOrder.id,
              currency_code: "eur",
              items: expect.arrayContaining([
                expect.objectContaining({
                  title: "test",
                  unit_price: 100,
                }),
              ]),
            })
          )
        })

        it("should create multiple orders with items", async () => {
          const createdOrders = await service.create([
            {
              currency_code: "eur",
              items: [
                {
                  title: "test",
                  quantity: 1,
                  unit_price: 100,
                },
              ],
            },
            {
              currency_code: "usd",
              items: [
                {
                  title: "test-2",
                  quantity: 2,
                  unit_price: 200,
                },
              ],
            },
          ])

          const orders = await service.list(
            { id: createdOrders.map((c) => c.id) },
            {
              relations: ["items.item"],
            }
          )

          expect(orders).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                currency_code: "eur",
                items: expect.arrayContaining([
                  expect.objectContaining({
                    title: "test",
                    unit_price: 100,
                    detail: expect.objectContaining({
                      quantity: 1,
                    }),
                  }),
                ]),
              }),
              expect.objectContaining({
                currency_code: "usd",
                items: expect.arrayContaining([
                  expect.objectContaining({
                    title: "test-2",
                    unit_price: 200,
                    quantity: 2,
                    raw_quantity: expect.objectContaining({
                      value: "2",
                    }),
                    detail: expect.objectContaining({
                      quantity: 2,
                    }),
                  }),
                ]),
              }),
            ])
          )
        })
      })

      describe("update", () => {
        it("should throw an error if order does not exist", async () => {
          const error = await service
            .update([
              {
                id: "none-existing",
              },
            ])
            .catch((e) => e)

          expect(error.message).toContain(
            'Order with id "none-existing" not found'
          )
        })

        it("should update an order successfully", async () => {
          const [createdOrder] = await service.create([
            {
              currency_code: "eur",
            },
          ])

          const [updatedOrder] = await service.update([
            {
              id: createdOrder.id,
              email: "test@email.com",
            },
          ])

          const [order] = await service.list({ id: [createdOrder.id] })

          expect(order).toEqual(
            expect.objectContaining({
              id: createdOrder.id,
              currency_code: "eur",
              email: updatedOrder.email,
            })
          )
        })

        it("should update an order with selector successfully", async () => {
          const createdOrder = await service.create({
            currency_code: "eur",
          })

          const [updatedOrder] = await service.update(
            { id: createdOrder.id },
            {
              email: "test@email.com",
              status: OrderStatus.DRAFT,
            }
          )

          const [order] = await service.list({ id: [createdOrder.id] })

          expect(order).toEqual(
            expect.objectContaining({
              id: createdOrder.id,
              status: "draft",
              currency_code: "eur",
              email: updatedOrder.email,
            })
          )
        })

        it("should update an order with id successfully", async () => {
          const [createdOrder] = await service.create([
            {
              currency_code: "eur",
            },
          ])

          const updatedOrder = await service.update(createdOrder.id, {
            email: "test@email.com",
          })

          const [order] = await service.list({ id: [createdOrder.id] })

          expect(order).toEqual(
            expect.objectContaining({
              id: createdOrder.id,
              currency_code: "eur",
              email: updatedOrder.email,
            })
          )
        })
      })

      describe("delete", () => {
        it("should delete an order successfully", async () => {
          const [createdOrder] = await service.create([
            {
              currency_code: "eur",
            },
          ])

          await service.delete([createdOrder.id])

          const orders = await service.list({ id: [createdOrder.id] })

          expect(orders.length).toEqual(0)
        })
      })

      describe("createAddresses", () => {
        it("should create an address successfully", async () => {
          const [createdAddress] = await service.createAddresses([
            {
              first_name: "John",
            },
          ])

          const [address] = await service.listAddresses({
            id: [createdAddress.id!],
          })

          expect(address).toEqual(
            expect.objectContaining({
              id: createdAddress.id,
              first_name: "John",
            })
          )
        })
      })

      describe("updateAddresses", () => {
        it("should update an address successfully", async () => {
          const [createdAddress] = await service.createAddresses([
            {
              first_name: "John",
            },
          ])

          const [updatedAddress] = await service.updateAddresses([
            { id: createdAddress.id!, first_name: "Jane" },
          ])

          expect(updatedAddress).toEqual(
            expect.objectContaining({
              id: createdAddress.id,
              first_name: "Jane",
            })
          )
        })
      })

      describe("deleteAddresses", () => {
        it("should delete an address successfully", async () => {
          const [createdAddress] = await service.createAddresses([
            {
              first_name: "John",
            },
          ])

          await service.deleteAddresses([createdAddress.id!])

          const [address] = await service.listAddresses({
            id: [createdAddress.id!],
          })

          expect(address).toBe(undefined)
        })
      })

      describe("addLineItems", () => {
        it("should add a line item to order succesfully", async () => {
          const [createdOrder] = await service.create([
            {
              currency_code: "eur",
            },
          ])

          await service.addLineItems(createdOrder.id, [
            {
              quantity: 1,
              unit_price: 100,
              title: "test",
            },
          ])

          const order = await service.retrieve(createdOrder.id, {
            relations: ["items.item"],
          })

          expect(order.items[0]).toEqual(
            expect.objectContaining({
              quantity: 1,
              title: "test",
              unit_price: 100,
            })
          )
          expect(order.items?.length).toBe(1)
        })

        it("should add multiple line items to order succesfully", async () => {
          const [createdOrder] = await service.create([
            {
              currency_code: "eur",
            },
          ])

          await service.addLineItems([
            {
              quantity: 1,
              unit_price: 100,
              title: "test",
              version: 1,
              order_id: createdOrder.id,
            },
            {
              quantity: 2,
              unit_price: 200,
              title: "test-2",
              version: 1,
              order_id: createdOrder.id,
            },
          ])

          const order = await service.retrieve(createdOrder.id, {
            relations: ["items.item"],
          })

          expect(order.items).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                title: "test",
                unit_price: 100,
                quantity: 1,
              }),
              expect.objectContaining({
                title: "test-2",
                unit_price: 200,
                quantity: 2,
              }),
            ])
          )

          expect(order.items?.length).toBe(2)
        })

        it("should add multiple line items to multiple orders succesfully", async () => {
          let [eurOrder, usdOrder] = await service.create([
            {
              currency_code: "eur",
              status: OrderStatus.DRAFT,
            },
            {
              currency_code: "usd",
              status: OrderStatus.DRAFT,
            },
          ])

          const items = await service.addLineItems([
            {
              order_id: eurOrder.id,
              quantity: 1,
              unit_price: 100,
              title: "test",
            },
            {
              order_id: usdOrder.id,
              quantity: 1,
              unit_price: 100,
              title: "test",
            },
          ])

          const orders = await service.list(
            { id: [eurOrder.id, usdOrder.id] },
            { relations: ["items.item"] }
          )

          eurOrder = orders.find((c) => c.currency_code === "eur")!
          usdOrder = orders.find((c) => c.currency_code === "usd")!

          const eurItems = orders.filter((i) => i.id === eurOrder.id)[0].items

          const usdItems = orders.filter((i) => i.id === usdOrder.id)[0].items

          expect(eurOrder.items[0].id).toBe(eurItems[0].id)
          expect(usdOrder.items[0].id).toBe(usdItems[0].id)

          expect(eurOrder.items?.length).toBe(1)
          expect(usdOrder.items?.length).toBe(1)
        })

        it("should throw if order does not exist", async () => {
          const error = await service
            .addLineItems("foo", [
              {
                quantity: 1,
                unit_price: 100,
                title: "test",
                tax_lines: [],
              },
            ])
            .catch((e) => e)

          expect(error.message).toContain("Order with id: foo was not found")
        })

        it("should throw an error when required params are not passed adding to a single order", async () => {
          const [createdOrder] = await service.create([
            {
              currency_code: "eur",
            },
          ])

          const error = await service
            .addLineItems(createdOrder.id, [
              {
                unit_price: 10,
                title: "test",
              },
            ] as any)
            .catch((e) => e)

          expect(error.message).toContain(
            "Value for OrderItem.quantity is required, 'undefined' found"
          )
        })

        it("should throw a generic error when required params are not passed using bulk add method", async () => {
          const [createdOrder] = await service.create([
            {
              currency_code: "eur",
            },
          ])

          const error = await service
            .addLineItems([
              {
                order_id: createdOrder.id,
                unit_price: 10,
                title: "test",
              },
            ] as any)
            .catch((e) => e)

          expect(error.message).toContain(
            "Value for OrderItem.quantity is required, 'undefined' found"
          )
        })
      })

      describe("updateLineItems", () => {
        it("should update a line item in order succesfully with selector approach", async () => {
          const [createdOrder] = await service.create([
            {
              currency_code: "eur",
            },
          ])

          const [item] = await service.addLineItems(createdOrder.id, [
            {
              quantity: 1,
              unit_price: 100,
              title: "test",
              tax_lines: [],
            },
          ])

          expect(item.title).toBe("test")

          const [updatedItem] = await service.updateLineItems(
            { id: item.id },
            {
              title: "test2",
            }
          )

          expect(updatedItem.title).toBe("test2")
        })

        it("should update a line item in order succesfully with id approach", async () => {
          const [createdOrder] = await service.create([
            {
              currency_code: "eur",
            },
          ])

          const [item] = await service.addLineItems(createdOrder.id, [
            {
              quantity: 1,
              unit_price: 100,
              title: "test",
              tax_lines: [],
            },
          ])

          expect(item.title).toBe("test")

          const updatedItem = await service.updateLineItems(item.id, {
            title: "test2",
          })

          expect(updatedItem.title).toBe("test2")
        })

        it("should update line items in orders succesfully with multi-selector approach", async () => {
          const [createdOrder] = await service.create([
            {
              currency_code: "eur",
            },
          ])

          const items = await service.addLineItems(createdOrder.id, [
            {
              quantity: 1,
              unit_price: 100,
              title: "test",
            },
            {
              quantity: 2,
              unit_price: 200,
              title: "other-test",
            },
          ])

          expect(items).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                title: "test",
                unit_price: 100,
              }),
              expect.objectContaining({
                title: "other-test",
                unit_price: 200,
              }),
            ])
          )

          const itemTwo = items.find((i) => i.title === "other-test")

          await service.updateLineItems([
            {
              selector: { unit_price: 100 },
              data: {
                title: "changed-test",
                quantity: 15,
              },
            },
            {
              selector: { id: itemTwo!.id },
              data: {
                title: "changed-other-test",
                quantity: 7,
              },
            },
          ])

          const order = await service.retrieve(createdOrder.id, {
            relations: ["items.item"],
          })

          expect(order.items).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                title: "changed-test",
                unit_price: 100,
                quantity: 15,
              }),
              expect.objectContaining({
                title: "changed-other-test",
                unit_price: 200,
                quantity: 7,
              }),
            ])
          )
        })
      })

      describe("deleteLineItems", () => {
        it("should delete a line item succesfully", async () => {
          const [createdOrder] = await service.create([
            {
              currency_code: "eur",
            },
          ])

          const [item] = await service.addLineItems(createdOrder.id, [
            {
              quantity: 1,
              unit_price: 100,
              title: "test",
              tax_lines: [],
            },
          ])

          expect(item.title).toBe("test")

          await service.deleteLineItems([item.id])

          const order = await service.retrieve(createdOrder.id, {
            relations: ["items"],
          })

          expect(order.items?.length).toBe(0)
        })

        it("should delete multiple line items succesfully", async () => {
          const [createdOrder] = await service.create([
            {
              currency_code: "eur",
            },
          ])

          const [item, item2] = await service.addLineItems(createdOrder.id, [
            {
              quantity: 1,
              unit_price: 100,
              title: "test",
            },
            {
              quantity: 1,
              unit_price: 100,
              title: "test-2",
            },
          ])

          await service.deleteLineItems([item.id, item2.id])

          const order = await service.retrieve(createdOrder.id, {
            relations: ["items"],
          })

          expect(order.items?.length).toBe(0)
        })
      })

      describe("addShippingMethods", () => {
        it("should add a shipping method to order succesfully", async () => {
          const [createdOrder] = await service.create([
            {
              currency_code: "eur",
            },
          ])

          const [method] = await service.addShippingMethods(createdOrder.id, [
            {
              amount: 100,
              name: "Test",
            },
          ])

          const order = await service.retrieve(createdOrder.id, {
            relations: ["shipping_methods"],
          })

          expect(method.id).toBe(order.shipping_methods![0].id)
        })

        it("should add multiple shipping methods to multiple orders succesfully", async () => {
          let [eurOrder] = await service.create([
            {
              currency_code: "eur",
            },
          ])

          let [usdOrder] = await service.create([
            {
              currency_code: "usd",
            },
          ])

          const methods = await service.addShippingMethods([
            {
              order_id: eurOrder.id,
              amount: 100,
              name: "Test One",
            },
            {
              order_id: usdOrder.id,
              amount: 100,
              name: "Test One",
            },
          ])

          const orders = await service.list(
            { id: [eurOrder.id, usdOrder.id] },
            { relations: ["shipping_methods"] }
          )

          eurOrder = orders.find((c) => c.currency_code === "eur")!
          usdOrder = orders.find((c) => c.currency_code === "usd")!

          const eurMethods = methods.filter((m) => m.order_id === eurOrder.id)
          const usdMethods = methods.filter((m) => m.order_id === usdOrder.id)

          expect(eurOrder.shipping_methods![0].id).toBe(eurMethods[0].id)
          expect(usdOrder.shipping_methods![0].id).toBe(usdMethods[0].id)

          expect(eurOrder.shipping_methods?.length).toBe(1)
          expect(usdOrder.shipping_methods?.length).toBe(1)
        })
      })

      describe("deleteShippingMethods", () => {
        it("should delete a line item succesfully", async () => {
          const [createdOrder] = await service.create([
            {
              currency_code: "eur",
            },
          ])

          const [method] = await service.addShippingMethods(createdOrder.id, [
            {
              amount: 100,
              name: "test",
            },
          ])

          expect(method.id).not.toBe(null)

          await service.deleteShippingMethods(method.id)

          const order = await service.retrieve(createdOrder.id, {
            relations: ["shipping_methods"],
          })

          expect(order.shipping_methods?.length).toBe(0)
        })
      })

      describe("setLineItemAdjustments", () => {
        it("should set line item adjustments for an order", async () => {
          const [createdOrder] = await service.create([
            {
              currency_code: "eur",
            },
          ])

          const [itemOne] = await service.addLineItems(createdOrder.id, [
            {
              quantity: 1,
              unit_price: 100,
              title: "test",
            },
          ])

          const [itemTwo] = await service.addLineItems(createdOrder.id, [
            {
              quantity: 2,
              unit_price: 200,
              title: "test-2",
            },
          ])

          const adjustments = await service.setLineItemAdjustments(
            createdOrder.id,
            [
              {
                item_id: itemOne.id,
                amount: 100,
                code: "FREE",
              },
              {
                item_id: itemTwo.id,
                amount: 200,
                code: "FREE-2",
              },
            ]
          )

          expect(adjustments).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                item_id: itemOne.id,
                amount: 100,
                code: "FREE",
              }),
              expect.objectContaining({
                item_id: itemTwo.id,
                amount: 200,
                code: "FREE-2",
              }),
            ])
          )
        })

        it("should replace line item adjustments for an order", async () => {
          const [createdOrder] = await service.create([
            {
              currency_code: "eur",
            },
          ])

          const [itemOne] = await service.addLineItems(createdOrder.id, [
            {
              quantity: 1,
              unit_price: 100,
              title: "test",
            },
          ])

          const adjustments = await service.setLineItemAdjustments(
            createdOrder.id,
            [
              {
                item_id: itemOne.id,
                amount: 100,
                code: "FREE",
              },
            ]
          )

          expect(adjustments).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                item_id: itemOne.id,
                amount: 100,
                code: "FREE",
              }),
            ])
          )

          await service.setLineItemAdjustments(createdOrder.id, [
            {
              item_id: itemOne.id,
              amount: 50,
              code: "50%",
            },
          ])

          const order = await service.retrieve(createdOrder.id, {
            relations: ["items.item.adjustments"],
          })

          expect(order.items).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                id: itemOne.id,
                adjustments: expect.arrayContaining([
                  expect.objectContaining({
                    item_id: itemOne.id,
                    amount: 50,
                    code: "50%",
                  }),
                ]),
              }),
            ])
          )

          expect(order.items.length).toBe(1)
          expect(order.items[0].adjustments?.length).toBe(1)
        })

        it("should delete all line item adjustments for an order", async () => {
          const [createdOrder] = await service.create([
            {
              currency_code: "eur",
            },
          ])

          const [itemOne] = await service.addLineItems(createdOrder.id, [
            {
              quantity: 1,
              unit_price: 100,
              title: "test",
            },
          ])

          const adjustments = await service.setLineItemAdjustments(
            createdOrder.id,
            [
              {
                item_id: itemOne.id,
                amount: 100,
                code: "FREE",
              },
            ]
          )

          expect(adjustments).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                item_id: itemOne.id,
                amount: 100,
                code: "FREE",
              }),
            ])
          )

          await service.setLineItemAdjustments(createdOrder.id, [])

          const order = await service.retrieve(createdOrder.id, {
            relations: ["items.item.adjustments"],
          })

          expect(order.items).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                id: itemOne.id,
                adjustments: [],
              }),
            ])
          )

          expect(order.items.length).toBe(1)
          expect(order.items[0].adjustments.length).toBe(0)
        })

        it("should update line item adjustments for an order", async () => {
          const [createdOrder] = await service.create([
            {
              currency_code: "eur",
            },
          ])

          const [itemOne] = await service.addLineItems(createdOrder.id, [
            {
              quantity: 1,
              unit_price: 100,
              title: "test",
            },
          ])

          const adjustments = await service.setLineItemAdjustments(
            createdOrder.id,
            [
              {
                item_id: itemOne.id,
                amount: 100,
                code: "FREE",
              },
            ]
          )

          expect(adjustments).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                item_id: itemOne.id,
                amount: 100,
                code: "FREE",
              }),
            ])
          )

          await service.setLineItemAdjustments(createdOrder.id, [
            {
              id: adjustments[0].id,
              item_id: itemOne.id,
              amount: 50,
              code: "50%",
            },
          ])

          const order = await service.retrieve(createdOrder.id, {
            relations: ["items.item.adjustments"],
          })

          expect(order.items).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                id: itemOne.id,
                adjustments: [
                  expect.objectContaining({
                    id: adjustments[0].id,
                    item_id: itemOne.id,
                    amount: 50,
                    code: "50%",
                  }),
                ],
              }),
            ])
          )

          expect(order.items.length).toBe(1)
          expect(order.items[0].adjustments.length).toBe(1)
        })
      })

      describe("addLineItemAdjustments", () => {
        it("should add line item adjustments for items in an order", async () => {
          const [createdOrder] = await service.create([
            {
              currency_code: "eur",
            },
          ])

          const [itemOne] = await service.addLineItems(createdOrder.id, [
            {
              quantity: 1,
              unit_price: 100,
              title: "test",
            },
          ])

          const adjustments = await service.addLineItemAdjustments(
            createdOrder.id,
            [
              {
                item_id: itemOne.id,
                amount: 100,
                code: "FREE",
              },
            ]
          )

          expect(adjustments).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                item_id: itemOne.id,
                amount: 100,
                code: "FREE",
              }),
            ])
          )
        })

        it("should add multiple line item adjustments for multiple line items", async () => {
          const [createdOrder] = await service.create([
            {
              currency_code: "eur",
            },
          ])

          const [itemOne] = await service.addLineItems(createdOrder.id, [
            {
              quantity: 1,
              unit_price: 100,
              title: "test",
            },
          ])
          const [itemTwo] = await service.addLineItems(createdOrder.id, [
            {
              quantity: 2,
              unit_price: 200,
              title: "test-2",
            },
          ])

          const adjustments = await service.addLineItemAdjustments(
            createdOrder.id,
            [
              {
                item_id: itemOne.id,
                amount: 100,
                code: "FREE",
              },
              {
                item_id: itemTwo.id,
                amount: 150,
                code: "CODE-2",
              },
            ]
          )

          expect(adjustments).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                item_id: itemOne.id,
                amount: 100,
                code: "FREE",
              }),
              expect.objectContaining({
                item_id: itemTwo.id,
                amount: 150,
                code: "CODE-2",
              }),
            ])
          )
        })

        it("should add line item adjustments for line items on multiple orders", async () => {
          let [orderOne, orderTwo] = await service.create([
            {
              currency_code: "eur",
            },
            {
              currency_code: "usd",
            },
          ])

          const [itemOne] = await service.addLineItems(orderOne.id, [
            {
              quantity: 1,
              unit_price: 100,
              title: "test",
            },
          ])
          const [itemTwo] = await service.addLineItems(orderTwo.id, [
            {
              quantity: 2,
              unit_price: 200,
              title: "test-2",
            },
          ])

          await service.addLineItemAdjustments([
            // item from order one
            {
              item_id: itemOne.id,
              amount: 125,
              code: "FREE",
            },
            // item from order two
            {
              item_id: itemTwo.id,
              amount: 150,
              code: "CODE-2",
            },
          ])

          const [checkOrderOne, checkOrderTwo] = await service.list(
            {},
            { relations: ["items.item.adjustments"] }
          )

          expect(checkOrderOne.items).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                quantity: 1,
                adjustments: expect.arrayContaining([
                  expect.objectContaining({
                    item_id: itemOne.id,
                    amount: 125,
                    code: "FREE",
                  }),
                ]),
              }),
            ])
          )

          expect(checkOrderTwo.items).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                quantity: 2,
                adjustments: expect.arrayContaining([
                  expect.objectContaining({
                    item_id: itemTwo.id,
                    amount: 150,
                    code: "CODE-2",
                  }),
                ]),
              }),
            ])
          )
        })
      })

      describe("deleteLineItemAdjustments", () => {
        it("should delete a line item succesfully", async () => {
          const [createdOrder] = await service.create([
            {
              currency_code: "eur",
            },
          ])

          const [item] = await service.addLineItems(createdOrder.id, [
            {
              quantity: 1,
              unit_price: 100,
              title: "test",
            },
          ])

          const [adjustment] = await service.addLineItemAdjustments(
            createdOrder.id,
            [
              {
                item_id: item.id,
                amount: 50,
              },
            ]
          )

          expect(adjustment.item_id).toBe(item.id)

          await service.deleteLineItemAdjustments(adjustment.id)

          const adjustments = await service.listLineItemAdjustments({
            item_id: item.id,
          })

          expect(adjustments?.length).toBe(0)
        })

        it("should delete a line item succesfully with selector", async () => {
          const [createdOrder] = await service.create([
            {
              currency_code: "eur",
            },
          ])

          const [item] = await service.addLineItems(createdOrder.id, [
            {
              quantity: 1,
              unit_price: 100,
              title: "test",
            },
          ])

          const [adjustment] = await service.addLineItemAdjustments(
            createdOrder.id,
            [
              {
                item_id: item.id,
                amount: 50,
              },
            ]
          )

          expect(adjustment.item_id).toBe(item.id)

          await service.deleteLineItemAdjustments({ item_id: item.id })

          const adjustments = await service.listLineItemAdjustments({
            item_id: item.id,
          })

          expect(adjustments?.length).toBe(0)
        })
      })

      describe("setShippingMethodAdjustments", () => {
        it("should set shipping method adjustments for an order", async () => {
          const [createdOrder] = await service.create([
            {
              currency_code: "eur",
            },
          ])

          const [shippingMethodOne] = await service.addShippingMethods(
            createdOrder.id,
            [
              {
                amount: 100,
                name: "test",
              },
            ]
          )

          const [shippingMethodTwo] = await service.addShippingMethods(
            createdOrder.id,
            [
              {
                amount: 200,
                name: "test-2",
              },
            ]
          )

          const adjustments = await service.setShippingMethodAdjustments(
            createdOrder.id,
            [
              {
                shipping_method_id: shippingMethodOne.id,
                amount: 100,
                code: "FREE",
              },
              {
                shipping_method_id: shippingMethodTwo.id,
                amount: 200,
                code: "FREE-2",
              },
            ]
          )

          expect(adjustments).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                shipping_method_id: shippingMethodOne.id,
                amount: 100,
                code: "FREE",
              }),
              expect.objectContaining({
                shipping_method_id: shippingMethodTwo.id,
                amount: 200,
                code: "FREE-2",
              }),
            ])
          )
        })

        it("should replace shipping method adjustments for an order", async () => {
          const [createdOrder] = await service.create([
            {
              currency_code: "eur",
            },
          ])

          const [shippingMethodOne] = await service.addShippingMethods(
            createdOrder.id,
            [
              {
                amount: 100,
                name: "test",
              },
            ]
          )

          const adjustments = await service.setShippingMethodAdjustments(
            createdOrder.id,
            [
              {
                shipping_method_id: shippingMethodOne.id,
                amount: 100,
                code: "FREE",
              },
            ]
          )

          expect(adjustments).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                shipping_method_id: shippingMethodOne.id,
                amount: 100,
                code: "FREE",
              }),
            ])
          )

          await service.setShippingMethodAdjustments(createdOrder.id, [
            {
              shipping_method_id: shippingMethodOne.id,
              amount: 50,
              code: "50%",
            },
          ])

          const order = await service.retrieve(createdOrder.id, {
            relations: ["shipping_methods.adjustments"],
          })

          expect(order.shipping_methods).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                id: shippingMethodOne.id,
                order_id: createdOrder.id,
                adjustments: expect.arrayContaining([
                  expect.objectContaining({
                    shipping_method_id: shippingMethodOne.id,
                    amount: 50,
                    code: "50%",
                  }),
                ]),
              }),
            ])
          )

          expect(order.shipping_methods?.length).toBe(1)
          expect(order.shipping_methods?.[0].adjustments?.length).toBe(1)
        })

        it("should delete all shipping method adjustments for an order", async () => {
          const [createdOrder] = await service.create([
            {
              currency_code: "eur",
            },
          ])

          const [shippingMethodOne] = await service.addShippingMethods(
            createdOrder.id,
            [
              {
                amount: 100,
                name: "test",
              },
            ]
          )

          const adjustments = await service.setShippingMethodAdjustments(
            createdOrder.id,
            [
              {
                shipping_method_id: shippingMethodOne.id,
                amount: 100,
                code: "FREE",
              },
            ]
          )

          expect(adjustments).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                shipping_method_id: shippingMethodOne.id,
                amount: 100,
                code: "FREE",
              }),
            ])
          )

          await service.setShippingMethodAdjustments(createdOrder.id, [])

          const order = await service.retrieve(createdOrder.id, {
            relations: ["shipping_methods.adjustments"],
          })

          expect(order.shipping_methods).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                id: shippingMethodOne.id,
                adjustments: [],
              }),
            ])
          )

          expect(order.shipping_methods?.length).toBe(1)
          expect(order.shipping_methods?.[0].adjustments?.length).toBe(0)
        })

        it("should update shipping method adjustments for an order", async () => {
          const [createdOrder] = await service.create([
            {
              currency_code: "eur",
            },
          ])

          const [shippingMethodOne] = await service.addShippingMethods(
            createdOrder.id,
            [
              {
                amount: 100,
                name: "test",
              },
            ]
          )

          const adjustments = await service.setShippingMethodAdjustments(
            createdOrder.id,
            [
              {
                shipping_method_id: shippingMethodOne.id,
                amount: 100,
                code: "FREE",
              },
            ]
          )

          expect(adjustments).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                shipping_method_id: shippingMethodOne.id,
                amount: 100,
                code: "FREE",
              }),
            ])
          )

          await service.setShippingMethodAdjustments(createdOrder.id, [
            {
              id: adjustments[0].id,
              amount: 50,
              code: "50%",
            },
          ])

          const order = await service.retrieve(createdOrder.id, {
            relations: ["shipping_methods.adjustments"],
          })

          expect(order.shipping_methods).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                id: shippingMethodOne.id,
                adjustments: [
                  expect.objectContaining({
                    id: adjustments[0].id,
                    shipping_method_id: shippingMethodOne.id,
                    amount: 50,
                    code: "50%",
                  }),
                ],
              }),
            ])
          )

          expect(order.shipping_methods?.length).toBe(1)
          expect(order.shipping_methods?.[0].adjustments?.length).toBe(1)
        })
      })

      describe("addShippingMethodAdjustments", () => {
        it("should add shipping method adjustments in an order", async () => {
          const [createdOrder] = await service.create([
            {
              currency_code: "eur",
            },
          ])

          const [shippingMethodOne] = await service.addShippingMethods(
            createdOrder.id,
            [
              {
                amount: 100,
                name: "test",
              },
            ]
          )

          const adjustments = await service.addShippingMethodAdjustments(
            createdOrder.id,
            [
              {
                shipping_method_id: shippingMethodOne.id,
                amount: 100,
                code: "FREE",
              },
            ]
          )

          expect(adjustments).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                shipping_method_id: shippingMethodOne.id,
                amount: 100,
                code: "FREE",
              }),
            ])
          )
        })

        it("should add multiple shipping method adjustments for multiple shipping methods", async () => {
          const [createdOrder] = await service.create([
            {
              currency_code: "eur",
            },
          ])

          const [shippingMethodOne] = await service.addShippingMethods(
            createdOrder.id,
            [
              {
                amount: 100,
                name: "test",
              },
            ]
          )
          const [shippingMethodTwo] = await service.addShippingMethods(
            createdOrder.id,
            [
              {
                amount: 200,
                name: "test-2",
              },
            ]
          )

          const adjustments = await service.addShippingMethodAdjustments(
            createdOrder.id,
            [
              {
                shipping_method_id: shippingMethodOne.id,
                amount: 100,
                code: "FREE",
              },
              {
                shipping_method_id: shippingMethodTwo.id,
                amount: 150,
                code: "CODE-2",
              },
            ]
          )

          expect(adjustments).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                shipping_method_id: shippingMethodOne.id,
                amount: 100,
                code: "FREE",
              }),
              expect.objectContaining({
                shipping_method_id: shippingMethodTwo.id,
                amount: 150,
                code: "CODE-2",
              }),
            ])
          )
        })

        it("should add shipping method adjustments for shipping methods on multiple orders", async () => {
          const [orderOne] = await service.create([
            {
              currency_code: "eur",
            },
          ])
          const [orderTwo] = await service.create([
            {
              currency_code: "usd",
            },
          ])

          const [shippingMethodOne] = await service.addShippingMethods(
            orderOne.id,
            [
              {
                amount: 100,
                name: "test",
              },
            ]
          )
          const [shippingMethodTwo] = await service.addShippingMethods(
            orderTwo.id,
            [
              {
                amount: 200,
                name: "test-2",
              },
            ]
          )

          await service.addShippingMethodAdjustments([
            // item from order one
            {
              shipping_method_id: shippingMethodOne.id,
              amount: 100,
              code: "FREE",
            },
            // item from order two
            {
              shipping_method_id: shippingMethodTwo.id,
              amount: 150,
              code: "CODE-2",
            },
          ])

          const orderOneMethods = await service.listShippingMethods(
            { order_id: orderOne.id },
            { relations: ["adjustments", "order"] }
          )

          const orderTwoMethods = await service.listShippingMethods(
            { order_id: orderTwo.id },
            { relations: ["adjustments", "order"] }
          )

          expect(orderOneMethods).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                adjustments: expect.arrayContaining([
                  expect.objectContaining({
                    shipping_method_id: shippingMethodOne.id,
                    amount: 100,
                    code: "FREE",
                  }),
                ]),
              }),
            ])
          )
          expect(orderTwoMethods).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                adjustments: expect.arrayContaining([
                  expect.objectContaining({
                    shipping_method_id: shippingMethodTwo.id,
                    amount: 150,
                    code: "CODE-2",
                  }),
                ]),
              }),
            ])
          )
        })

        it("should throw if shipping method is not associated with order", async () => {
          const [orderOne] = await service.create([
            {
              currency_code: "eur",
            },
          ])

          const [orderTwo] = await service.create([
            {
              currency_code: "eur",
            },
          ])

          const [shippingMethodOne] = await service.addShippingMethods(
            orderOne.id,
            [
              {
                amount: 100,
                name: "test",
              },
            ]
          )

          const error = await service
            .addShippingMethodAdjustments(orderTwo.id, [
              {
                shipping_method_id: shippingMethodOne.id,
                amount: 100,
                code: "FREE",
              },
            ])
            .catch((e) => e)

          expect(error.message).toBe(
            `Shipping method with id ${shippingMethodOne.id} does not exist on order with id ${orderTwo.id}`
          )
        })
      })

      describe("deleteShippingMethodAdjustments", () => {
        it("should delete a shipping method succesfully", async () => {
          const [createdOrder] = await service.create([
            {
              currency_code: "eur",
            },
          ])

          const [method] = await service.addShippingMethods(createdOrder.id, [
            {
              amount: 100,
              name: "test",
            },
          ])

          const [adjustment] = await service.addShippingMethodAdjustments(
            createdOrder.id,
            [
              {
                shipping_method_id: method.id,
                amount: 50,
                code: "50%",
              },
            ]
          )

          expect(adjustment.shipping_method_id).toBe(method.id)

          await service.deleteShippingMethodAdjustments(adjustment.id)

          const adjustments = await service.listShippingMethodAdjustments({
            shipping_method_id: method.id,
          })

          expect(adjustments?.length).toBe(0)
        })

        it("should delete a shipping method succesfully with selector", async () => {
          const [createdOrder] = await service.create([
            {
              currency_code: "eur",
            },
          ])

          const [shippingMethod] = await service.addShippingMethods(
            createdOrder.id,
            [
              {
                amount: 100,
                name: "test",
              },
            ]
          )

          const [adjustment] = await service.addShippingMethodAdjustments(
            createdOrder.id,
            [
              {
                shipping_method_id: shippingMethod.id,
                amount: 50,
                code: "50%",
              },
            ]
          )

          expect(adjustment.shipping_method_id).toBe(shippingMethod.id)

          await service.deleteShippingMethodAdjustments({
            shipping_method_id: shippingMethod.id,
          })

          const adjustments = await service.listShippingMethodAdjustments({
            shipping_method_id: shippingMethod.id,
          })

          expect(adjustments?.length).toBe(0)
        })
      })

      describe("setLineItemTaxLines", () => {
        it("should set line item tax lines for an order", async () => {
          const [createdOrder] = await service.create([
            {
              currency_code: "eur",
            },
          ])

          const [itemOne] = await service.addLineItems(createdOrder.id, [
            {
              quantity: 1,
              unit_price: 100,
              title: "test",
            },
          ])

          const [itemTwo] = await service.addLineItems(createdOrder.id, [
            {
              quantity: 2,
              unit_price: 200,
              title: "test-2",
            },
          ])

          const taxLines = await service.setLineItemTaxLines(createdOrder.id, [
            {
              item_id: itemOne.id,
              rate: 20,
              code: "TX",
            },
            {
              item_id: itemTwo.id,
              rate: 20,
              code: "TX",
            },
          ])

          expect(taxLines).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                item_id: itemOne.id,
                rate: 20,
                code: "TX",
              }),
              expect.objectContaining({
                item_id: itemTwo.id,
                rate: 20,
                code: "TX",
              }),
            ])
          )
        })

        it("should replace line item tax lines for an order", async () => {
          const [createdOrder] = await service.create([
            {
              currency_code: "eur",
            },
          ])

          const [itemOne] = await service.addLineItems(createdOrder.id, [
            {
              quantity: 1,
              unit_price: 100,
              title: "test",
            },
          ])

          const taxLines = await service.setLineItemTaxLines(createdOrder.id, [
            {
              item_id: itemOne.id,
              rate: 20,
              code: "TX",
            },
          ])

          expect(taxLines).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                item_id: itemOne.id,
                rate: 20,
                code: "TX",
              }),
            ])
          )

          await service.setLineItemTaxLines(createdOrder.id, [
            {
              item_id: itemOne.id,
              rate: 25,
              code: "TX-2",
            },
          ])

          const order = await service.retrieve(createdOrder.id, {
            relations: ["items.item.tax_lines"],
          })

          expect(order.items).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                id: itemOne.id,
                tax_lines: expect.arrayContaining([
                  expect.objectContaining({
                    item_id: itemOne.id,
                    rate: 25,
                    code: "TX-2",
                  }),
                ]),
              }),
            ])
          )

          expect(order.items.length).toBe(1)
          expect(order.items[0].tax_lines.length).toBe(1)
        })

        it("should delete all line item tax lines for an order", async () => {
          const [createdOrder] = await service.create([
            {
              currency_code: "eur",
            },
          ])

          const [itemOne] = await service.addLineItems(createdOrder.id, [
            {
              quantity: 1,
              unit_price: 100,
              title: "test",
            },
          ])

          const taxLines = await service.setLineItemTaxLines(createdOrder.id, [
            {
              item_id: itemOne.id,
              rate: 20,
              code: "TX",
            },
          ])

          expect(taxLines).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                item_id: itemOne.id,
                rate: 20,
                code: "TX",
              }),
            ])
          )

          await service.setLineItemTaxLines(createdOrder.id, [])

          const order = await service.retrieve(createdOrder.id, {
            relations: ["items.item.tax_lines"],
          })

          expect(order.items).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                id: itemOne.id,
                tax_lines: [],
              }),
            ])
          )

          expect(order.items.length).toBe(1)
          expect(order.items[0].tax_lines.length).toBe(0)
        })

        it("should update line item tax lines for an order", async () => {
          const [createdOrder] = await service.create([
            {
              currency_code: "eur",
            },
          ])

          const [itemOne] = await service.addLineItems(createdOrder.id, [
            {
              quantity: 1,
              unit_price: 100,
              title: "test",
            },
          ])

          const taxLines = await service.setLineItemTaxLines(createdOrder.id, [
            {
              item_id: itemOne.id,
              rate: 20,
              code: "TX",
            },
          ])

          expect(taxLines).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                item_id: itemOne.id,
                rate: 20,
                code: "TX",
              }),
            ])
          )

          await service.setLineItemTaxLines(createdOrder.id, [
            {
              id: taxLines[0].id,
              item_id: itemOne.id,
              rate: 25,
              code: "TX",
            },
          ])

          const order = await service.retrieve(createdOrder.id, {
            relations: ["items.item.tax_lines"],
          })

          expect(order.items).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                id: itemOne.id,
                tax_lines: [
                  expect.objectContaining({
                    id: taxLines[0].id,
                    item_id: itemOne.id,
                    rate: 25,
                    code: "TX",
                  }),
                ],
              }),
            ])
          )

          expect(order.items.length).toBe(1)
          expect(order.items[0].tax_lines.length).toBe(1)
        })

        it("should delete, update, and create line item tax lines for an order", async () => {
          const [createdOrder] = await service.create([
            {
              currency_code: "eur",
            },
          ])

          const [itemOne] = await service.addLineItems(createdOrder.id, [
            {
              quantity: 1,
              unit_price: 100,
              title: "test",
            },
          ])

          const taxLines = await service.setLineItemTaxLines(createdOrder.id, [
            {
              item_id: itemOne.id,
              rate: 20,
              code: "TX",
            },
            {
              item_id: itemOne.id,
              rate: 25,
              code: "TX",
            },
          ])

          expect(taxLines).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                item_id: itemOne.id,
                rate: 20,
                code: "TX",
              }),
              expect.objectContaining({
                item_id: itemOne.id,
                rate: 25,
                code: "TX",
              }),
            ])
          )

          const taxLine = taxLines.find((tx) => tx.item_id === itemOne.id)

          await service.setLineItemTaxLines(createdOrder.id, [
            // update
            {
              id: taxLine.id,
              rate: 40,
              code: "TX",
            },
            // create
            {
              item_id: itemOne.id,
              rate: 25,
              code: "TX-2",
            },
            // delete: should delete the initial tax line for itemOne
          ])

          const order = await service.retrieve(createdOrder.id, {
            relations: ["items.item.tax_lines"],
          })

          expect(order.items).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                id: itemOne.id,
                tax_lines: [
                  expect.objectContaining({
                    id: taxLine!.id,
                    item_id: itemOne.id,
                    rate: 40,
                    code: "TX",
                  }),
                  expect.objectContaining({
                    item_id: itemOne.id,
                    rate: 25,
                    code: "TX-2",
                  }),
                ],
              }),
            ])
          )

          expect(order.items.length).toBe(1)
          expect(order.items[0].tax_lines.length).toBe(2)
        })
      })

      describe("addLineItemAdjustments", () => {
        it("should add line item tax lines for items in an order", async () => {
          const [createdOrder] = await service.create([
            {
              currency_code: "eur",
            },
          ])

          const [itemOne] = await service.addLineItems(createdOrder.id, [
            {
              quantity: 1,
              unit_price: 100,
              title: "test",
            },
          ])

          const taxLines = await service.addLineItemTaxLines(createdOrder.id, [
            {
              item_id: itemOne.id,
              rate: 20,
              code: "TX",
            },
          ])

          expect(taxLines).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                item_id: itemOne.id,
                rate: 20,
                code: "TX",
              }),
            ])
          )
        })

        it("should add multiple line item tax lines for multiple line items", async () => {
          const [createdOrder] = await service.create([
            {
              currency_code: "eur",
            },
          ])

          const [itemOne] = await service.addLineItems(createdOrder.id, [
            {
              quantity: 1,
              unit_price: 100,
              title: "test",
            },
          ])
          const [itemTwo] = await service.addLineItems(createdOrder.id, [
            {
              quantity: 2,
              unit_price: 200,
              title: "test-2",
            },
          ])

          const taxLines = await service.addLineItemTaxLines(createdOrder.id, [
            {
              item_id: itemOne.id,
              rate: 20,
              code: "TX",
            },
            {
              item_id: itemTwo.id,
              rate: 20,
              code: "TX",
            },
          ])

          expect(taxLines).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                item_id: itemOne.id,
                rate: 20,
                code: "TX",
              }),
              expect.objectContaining({
                item_id: itemTwo.id,
                rate: 20,
                code: "TX",
              }),
            ])
          )
        })

        it("should add line item tax lines for line items on multiple orders", async () => {
          const [orderOne] = await service.create([
            {
              currency_code: "eur",
            },
          ])
          const [orderTwo] = await service.create([
            {
              currency_code: "usd",
            },
          ])

          const [itemOne] = await service.addLineItems(orderOne.id, [
            {
              quantity: 1,
              unit_price: 100,
              title: "test",
            },
          ])
          const [itemTwo] = await service.addLineItems(orderTwo.id, [
            {
              quantity: 2,
              unit_price: 200,
              title: "test-2",
            },
          ])

          await service.addLineItemTaxLines([
            // item from order one
            {
              item_id: itemOne.id,
              rate: 20,
              code: "TX",
            },
            // item from order two
            {
              item_id: itemTwo.id,
              rate: 25,
              code: "TX-2",
            },
          ])

          const [checkOrderOne, checkOrderTwo] = await service.list(
            {},
            { relations: ["items.item.tax_lines"] }
          )

          expect(checkOrderOne.items).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                quantity: 1,
                tax_lines: expect.arrayContaining([
                  expect.objectContaining({
                    item_id: itemOne.id,
                    rate: 20,
                    code: "TX",
                  }),
                ]),
              }),
            ])
          )

          expect(checkOrderTwo.items).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                quantity: 2,
                tax_lines: expect.arrayContaining([
                  expect.objectContaining({
                    item_id: itemTwo.id,
                    rate: 25,
                    code: "TX-2",
                  }),
                ]),
              }),
            ])
          )
        })
      })

      describe("deleteLineItemAdjustments", () => {
        it("should delete line item tax line succesfully", async () => {
          const [createdOrder] = await service.create([
            {
              currency_code: "eur",
            },
          ])

          const [item] = await service.addLineItems(createdOrder.id, [
            {
              quantity: 1,
              unit_price: 100,
              title: "test",
            },
          ])

          const [taxLine] = await service.addLineItemTaxLines(createdOrder.id, [
            {
              item_id: item.id,
              rate: 20,
              code: "TX",
            },
          ])

          expect(taxLine.item_id).toBe(item.id)

          await service.deleteLineItemTaxLines(taxLine.id)

          const taxLines = await service.listLineItemTaxLines({
            item_id: item.id,
          })

          expect(taxLines?.length).toBe(0)
        })

        it("should delete line item tax lines succesfully with selector", async () => {
          const [createdOrder] = await service.create([
            {
              currency_code: "eur",
            },
          ])

          const [item] = await service.addLineItems(createdOrder.id, [
            {
              quantity: 1,
              unit_price: 100,
              title: "test",
            },
          ])

          const [taxLine] = await service.addLineItemTaxLines(createdOrder.id, [
            {
              item_id: item.id,
              rate: 20,
              code: "TX",
            },
          ])

          expect(taxLine.item_id).toBe(item.id)

          await service.deleteLineItemTaxLines({ item_id: item.id })

          const taxLines = await service.listLineItemTaxLines({
            item_id: item.id,
          })

          expect(taxLines?.length).toBe(0)
        })
      })
    })
  },
})
