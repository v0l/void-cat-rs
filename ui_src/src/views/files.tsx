import { NostrEvent } from "@snort/system";
import { useState } from "react";
import { FormatBytes } from "../const";

interface FileInfo {
  id: string;
  url: string;
  name?: string;
  type?: string;
  size?: number;
}

export default function FileList({
  files,
  pages,
  page,
  onPage,
}: {
  files: Array<File | NostrEvent>;
  pages?: number;
  page?: number;
  onPage?: (n: number) => void;
}) {
  const [viewType, setViewType] = useState<"grid" | "list">("grid");
  if (files.length === 0) {
    return <b>No Files</b>;
  }

  function renderInner(f: FileInfo) {
    if (f.type?.startsWith("image/")) {
      return (
        <img src={f.url} className="w-full h-full object-cover object-center" />
      );
    } else if (f.type?.startsWith("video/")) {
      return (
        <div className="w-full h-full flex items-center justify-center">
          Video
        </div>
      );
    }
  }

  function getInfo(f: File | NostrEvent): FileInfo {
    if ("created_at" in f) {
      return {
        id: f.tags.find((a) => a[0] === "x")![1],
        url: f.tags.find((a) => a[0] === "url")![1],
        name: f.content,
        type: f.tags.find((a) => a[0] === "m")?.at(1),
        size: Number(f.tags.find((a) => a[0] === "size")?.at(1)),
      };
    } else {
      return {
        id: f.name,
        url: URL.createObjectURL(f),
        name: f.name,
        type: f.type,
        size: f.size,
      };
    }
  }

  function pageButtons(page: number, n: number) {
    const ret = [];
    const start = 0;

    for (let x = start; x < n; x++) {
      ret.push(
        <div
          onClick={() => onPage?.(x)}
          className={`bg-neutral-800 hover:bg-neutral-700 min-w-8 text-center cursor-pointer font-bold ${x === start ? "rounded-l-md" : ""} ${x === n - 1 ? "rounded-r-md" : ""} ${page === x ? "bg-neutral-500" : ""}`}
        >
          {x + 1}
        </div>,
      );
    }

    return ret;
  }

  function showGrid() {
    return (
      <div className="grid grid-cols-4 gap-2">
        {files.map((a) => {
          const info = getInfo(a);

          return (
            <div
              key={info.id}
              className="relative rounded-md aspect-square overflow-hidden bg-neutral-800"
            >
              <div className="absolute flex flex-col items-center justify-center w-full h-full text-wrap text-sm break-all text-center opacity-0 hover:opacity-100 hover:bg-black/60">
                <div>
                  {(info.name?.length ?? 0) === 0 ? "Untitled" : info.name}
                </div>
                <div>
                  {info.size && !isNaN(info.size)
                    ? FormatBytes(info.size, 2)
                    : ""}
                </div>
                <a href={info.url} target="_blank" className="underline">
                  Link
                </a>
              </div>
              {renderInner(info)}
            </div>
          );
        })}
      </div>
    );
  }

  function showList() {
    return (
      <table className="table-auto text-sm">
        <thead>
          <tr>
            <th className="border border-neutral-400 bg-neutral-500 py-1 px-2">
              Name
            </th>
            <th className="border border-neutral-400 bg-neutral-500 py-1 px-2">
              Size
            </th>
            <th className="border border-neutral-400 bg-neutral-500 py-1 px-2">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {files.map((a) => {
            const info = getInfo(a);
            return (
              <tr key={info.id}>
                <td className="border border-neutral-500 py-1 px-2">
                  {(info.name?.length ?? 0) === 0 ? "<Untitled>" : info.name}
                </td>
                <td className="border border-neutral-500 py-1 px-2">
                  {info.size && !isNaN(info.size)
                    ? FormatBytes(info.size, 2)
                    : ""}
                </td>
                <td className="border border-neutral-500 py-1 px-2">
                  <a href={info.url} className="underline" target="_blank">
                    Link
                  </a>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  }

  return (
    <>
      <div className="flex">
        <div
          onClick={() => setViewType("grid")}
          className={`bg-neutral-800 hover:bg-neutral-600 min-w-20 text-center cursor-pointer font-bold rounded-l-md ${viewType === "grid" ? "bg-neutral-500" : ""}`}
        >
          Grid
        </div>
        <div
          onClick={() => setViewType("list")}
          className={`bg-neutral-800 hover:bg-neutral-600 min-w-20 text-center cursor-pointer font-bold rounded-r-md ${viewType === "list" ? "bg-neutral-500" : ""}`}
        >
          List
        </div>
      </div>
      {viewType === "grid" ? showGrid() : showList()}
      {pages !== undefined && (
        <>
          Page:
          <div className="flex">{pageButtons(page ?? 0, pages)}</div>
        </>
      )}
    </>
  );
}
