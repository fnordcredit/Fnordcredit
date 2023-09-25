import prisma from "@lib/prisma";
import Image from "next/image";
import AddProductDialog from "./AddProductDialog";
import { addProductAction } from "@actions/admin/products";
import VisibilityToggle from "./VisibilityToggle";
import AppBar from "@components/AppBar";
import formatCurrency from "@lib/formatCurrency";

export default async function ProductPage() {
  const cats = await prisma.productCategory.findMany({
    include: {
      products: {
        orderBy: {
          id: "asc",
        },
      },
    },
    orderBy: {
      id: "asc",
    },
  });
  return (
    <>
      <AppBar></AppBar>
      <div className="flex flex-wrap m-4">
        {cats.map((c) => (
          <div
            key={c.id}
            className="m-4 p-4 bg-white/50 dark:bg-gray-700/50 rounded-xl border-black"
          >
            <div className="flex">
              <h3 className="flex-grow text-xl font-bold">{c.name}</h3>
              <AddProductDialog categoryId={c.id} action={addProductAction} />
            </div>
            <div className="table w-full m-1">
              <div className="card table-row font-bold">
                {[
                  <>
                    {"#"}
                    <sub>Id</sub>
                  </>,
                  "Image",
                  "Name",
                  "Price",
                  "EAN",
                  "Visible",
                ].map((s, i) => (
                  <div
                    key={i}
                    className="table-cell border-b-2 border-black px-3 py-1 text-center dark:border-white"
                  >
                    {s}
                  </div>
                ))}
              </div>
              {c.products.map((p) => (
                <div className="card table-row" key={p.id}>
                  <div className="table-cell p-1 text-center">{p.id}</div>
                  <div className="table-cell border-l border-black px-3 py-1 align-middle dark:border-white">
                    {p.image != null ? (
                      <Image
                        src={p.image}
                        width={32}
                        height={32}
                        alt="Product Image"
                        className="mx-auto"
                      />
                    ) : (
                      "No Image"
                    )}
                  </div>
                  <div className="table-cell border-l border-black px-3 py-1 align-middle dark:border-white">
                    {p.name}
                  </div>
                  <div className="table-cell border-l border-black px-3 py-1 align-middle dark:border-white">
                    {formatCurrency(p.price)}
                  </div>
                  <div className="table-cell border-l border-black px-3 py-1 align-middle dark:border-white">
                    {p.ean}
                  </div>
                  <div className="table-cell border-l border-black px-3 py-1 align-middle dark:border-white">
                    <VisibilityToggle productId={p.id} hidden={p.hidden} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
