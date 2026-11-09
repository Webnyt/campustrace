import React from 'react';
import { LostFoundItem } from '../types';
import { MapPin, Phone, CheckCircle2, Eye, FileText, Check } from 'lucide-react';

interface ItemTableViewProps {
  items: LostFoundItem[];
  onClaimClick: (item: LostFoundItem) => void;
  onViewDetails: (item: LostFoundItem) => void;
  onPrintNotice: (item: LostFoundItem) => void;
}

export const ItemTableView: React.FC<ItemTableViewProps> = ({
  items,
  onClaimClick,
  onViewDetails,
  onPrintNotice,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase font-bold text-slate-500 tracking-wider">
            <tr>
              <th className="px-4 py-3.5">Item</th>
              <th className="px-4 py-3.5">Category</th>
              <th className="px-4 py-3.5">Location Found</th>
              <th className="px-4 py-3.5">Status</th>
              <th className="px-4 py-3.5">Finder Contact</th>
              <th className="px-4 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item) => {
              const isClaimed = item.item_status === 'Claimed';
              return (
                <tr
                  key={item.item_id}
                  className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                  onClick={() => onViewDetails(item)}
                >
                  <td className="px-4 py-3.5">
                    <div className="flex items-center space-x-3">
                      {item.image_path ? (
                        <img
                          src={item.image_path}
                          alt={item.item_name}
                          className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0">
                          {item.item_name.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="font-bold text-slate-900 hover:text-indigo-600">
                          {item.item_name}
                        </div>
                        <div className="text-[11px] text-slate-400 line-clamp-1 max-w-xs">
                          {item.description}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 font-medium text-slate-700">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[11px]">
                      {item.category_name}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center space-x-1 text-slate-700">
                      <MapPin className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span className="font-medium truncate max-w-xs">{item.location_found}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        isClaimed
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {isClaimed ? (
                        <>
                          <Check className="w-3 h-3 mr-0.5 text-emerald-600" />
                          <span>Returned</span>
                        </>
                      ) : (
                        <span>Unclaimed</span>
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                    <a
                      href={`tel:${item.finder_contact}`}
                      className="font-mono font-bold text-indigo-600 hover:underline flex items-center space-x-1"
                    >
                      <Phone className="w-3 h-3" />
                      <span>{item.finder_contact}</span>
                    </a>
                  </td>
                  <td
                    className="px-4 py-3.5 text-right space-x-1.5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {!isClaimed ? (
                      <button
                        onClick={() => onClaimClick(item)}
                        className="bg-slate-900 hover:bg-indigo-600 text-white font-semibold text-xs px-2.5 py-1.5 rounded-lg transition"
                      >
                        Claim
                      </button>
                    ) : (
                      <span className="text-emerald-700 font-semibold text-xs">Returned</span>
                    )}
                    <button
                      onClick={() => onViewDetails(item)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-1.5 rounded-lg transition"
                      title="View Details"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onPrintNotice(item)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-1.5 rounded-lg transition"
                      title="Flyer Notice"
                    >
                      <FileText className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
