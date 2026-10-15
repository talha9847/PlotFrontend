/////////////////////////
///PLOT LIST ON PLOTS.JSX
/////////////////////////



//  <div className="overflow-hidden rounded-2xl border border-[#e3e9e0] bg-white shadow-sm shadow-[#062a20]/[0.03]">
//         <div className="flex flex-col gap-3 border-b border-[#eef2ec] p-5 sm:flex-row sm:items-center sm:justify-between">
//           <div>
//             <p className="text-lg font-semibold text-[#14231d]" style={DISPLAY}>
//               Plot list
//             </p>

//             <p className="mt-1 text-xs text-[#5b6b63]">
//               {loadingPlots
//                 ? "Loading plots..."
//                 : `${pagination.total === 0 ? 0 : (page - 1) * limit + 1}–${Math.min(page * limit, pagination.total)} of ${pagination.total} plots`}
//             </p>
//           </div>

//           <Select
//             wrapperClassName="w-full sm:w-[220px]"
//             aria-label="Sort plots"
//             value={sort}
//             onChange={(event) => {
//               setSort(event.target.value || "plot");
//               setPage(1);
//             }}
//             placeholder="Sort: Plot number"
//             options={SORTS}
//           />
//         </div>

//         <div className="overflow-x-auto">
//           <table className="w-full min-w-[640px] text-left text-sm">
//             <thead>
//               <tr className="bg-[#f4f7f2] text-[10px] font-bold uppercase tracking-[0.14em] text-[#5b6b63]">
//                 {["Plot number", "Area", "Price", "Status", ""].map(
//                   (heading, index) => (
//                     <th key={index} className="px-5 py-3.5">
//                       {heading}
//                     </th>
//                   ),
//                 )}
//               </tr>
//             </thead>

//             <tbody>
//               {!loadingPlots &&
//                 list.map((plot) => (
//                   <tr
//                     key={plot.uuid || plot.id}
//                     onClick={() => setSelected(plot)}
//                     className="group cursor-pointer border-t border-[#eef2ec] transition hover:bg-[#f8faf6]"
//                   >
//                     <td className="px-5 py-4">
//                       <span className="rounded-lg bg-[#e9f3ee] px-2.5 py-1 text-xs font-extrabold text-[#0b3d2e]">
//                         {plot.plotNo}
//                       </span>
//                     </td>

//                     <td className="px-5 py-4 text-[#3f4f48]">
//                       {fmtArea(plot.area)}
//                     </td>

//                     <td className="px-5 py-4 font-bold text-[#14231d]">
//                       {inr(plot.price)}
//                     </td>

//                     <td className="px-5 py-4">
//                       <Badge>{plot.status}</Badge>
//                     </td>

//                     <td className="px-5 py-4 text-right">
//                       <button
//                         type="button"
//                         onClick={(event) => {
//                           event.stopPropagation();
//                           setSelected(plot);
//                         }}
//                         className="inline-flex items-center gap-1 text-xs font-extrabold text-[#1b7a5a] transition group-hover:gap-2"
//                       >
//                         Details <ArrowUpRight size={14} />
//                       </button>
//                     </td>
//                   </tr>
//                 ))}

//               {!loadingPlots && list.length === 0 && (
//                 <tr>
//                   <td colSpan={5} className="px-5 py-16 text-center">
//                     <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#e9f3ee] text-[#1b7a5a]">
//                       <Search size={20} />
//                     </span>

//                     <p className="mt-4 text-sm font-bold text-[#14231d]">
//                       {error ? "Could not load plots" : "No plots match"}
//                     </p>

//                     <button
//                       type="button"
//                       onClick={() => {
//                         setQuery("");
//                         setStatus("");
//                         setPage(1);
//                       }}
//                       className="mt-3 text-xs font-extrabold text-[#1b7a5a] hover:underline"
//                     >
//                       Clear filters
//                     </button>
//                   </td>
//                 </tr>
//               )}
//             </tbody>
//           </table>
//         </div>

//         {/* Server-side pagination controls */}
//         <div className="flex flex-col gap-4 border-t border-[#eef2ec] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
//           <div className="flex items-center gap-2 text-xs text-[#5b6b63]">
//             <span>Rows per page</span>
//             <select
//               value={limit}
//               onChange={(event) => {
//                 setLimit(Number(event.target.value));
//                 setPage(1);
//               }}
//               className="rounded-lg border border-[#dfe5dc] bg-white px-2.5 py-2 text-sm text-[#14231d] outline-none focus:border-[#1b7a5a]"
//               aria-label="Rows per page"
//             >
//               {PAGE_SIZES.map((size) => (
//                 <option key={size} value={size}>
//                   {size}
//                 </option>
//               ))}
//             </select>
//           </div>

//           <div className="flex items-center justify-between gap-3 sm:justify-end">
//             <span className="text-xs text-[#5b6b63]">
//               Page {pagination.totalPages === 0 ? 0 : page} of{" "}
//               {pagination.totalPages}
//             </span>
//             <button
//               type="button"
//               disabled={loadingPlots || page <= 1}
//               onClick={() => setPage((current) => Math.max(1, current - 1))}
//               className="rounded-lg border border-[#dfe5dc] px-3 py-2 text-xs font-bold text-[#0b3d2e] transition hover:bg-[#f4f7f2] disabled:cursor-not-allowed disabled:opacity-40"
//             >
//               Previous
//             </button>
//             <button
//               type="button"
//               disabled={
//                 loadingPlots ||
//                 pagination.totalPages === 0 ||
//                 page >= pagination.totalPages
//               }
//               onClick={() =>
//                 setPage((current) =>
//                   Math.min(pagination.totalPages, current + 1),
//                 )
//               }
//               className="rounded-lg border border-[#dfe5dc] px-3 py-2 text-xs font-bold text-[#0b3d2e] transition hover:bg-[#f4f7f2] disabled:cursor-not-allowed disabled:opacity-40"
//             >
//               Next
//             </button>
//           </div>
//         </div>
