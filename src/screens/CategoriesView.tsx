import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  X,
  Check,
  Palette,
  AlertTriangle,
} from 'lucide-react';
import { dbService } from '../services/db';
import { Category } from '../types/finance';
import { CategoryIcon, AVAILABLE_ICONS, CATEGORY_COLORS } from '../components/CategoryIcon';

interface CategoriesViewProps {
  onBack: () => void;
}

export const CategoriesView: React.FC<CategoriesViewProps> = ({ onBack }) => {
  const [dbState, setDbState] = useState(dbService.getState());
  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [catName, setCatName] = useState('');
  const [catIcon, setCatIcon] = useState('Utensils');
  const [catColor, setCatColor] = useState('#F97316');

  // Deletion Reassignment Modal
  const [deleteCat, setDeleteCat] = useState<Category | null>(null);
  const [reassignToId, setReassignToId] = useState<string>('');

  useEffect(() => {
    return dbService.subscribe(() => {
      setDbState({ ...dbService.getState() });
    });
  }, []);

  const categories = dbState.categories.filter((c) => c.type === activeTab);

  const openCreateModal = () => {
    setEditingCategory(null);
    setCatName('');
    setCatIcon(activeTab === 'income' ? 'Coins' : 'Utensils');
    setCatColor(activeTab === 'income' ? '#10B981' : '#F97316');
    setIsModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setCatName(cat.name);
    setCatIcon(cat.icon);
    setCatColor(cat.color);
    setIsModalOpen(true);
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;

    if (editingCategory) {
      dbService.updateCategory(editingCategory.id, {
        name: catName.trim(),
        icon: catIcon,
        color: catColor,
      });
    } else {
      dbService.addCategory({
        name: catName.trim(),
        type: activeTab,
        icon: catIcon,
        color: catColor,
        sortOrder: categories.length + 1,
        isHidden: false,
        isDefault: false,
      });
    }

    setIsModalOpen(false);
  };

  const handleToggleHide = (cat: Category) => {
    dbService.updateCategory(cat.id, { isHidden: !cat.isHidden });
  };

  const confirmDeleteCategory = (cat: Category) => {
    const usageCount = dbState.transactions.filter((t) => t.categoryId === cat.id).length;
    if (usageCount > 0) {
      // Prompt for reassignment
      setDeleteCat(cat);
      const otherCats = categories.filter((c) => c.id !== cat.id);
      setReassignToId(otherCats[0]?.id || '');
    } else {
      // Direct delete
      dbService.deleteCategory(cat.id);
    }
  };

  const executeDeleteReassign = (reassign: boolean) => {
    if (!deleteCat) return;
    dbService.deleteCategory(deleteCat.id, reassign ? reassignToId : undefined);
    setDeleteCat(null);
  };

  return (
    <div className="flex-1 overflow-y-auto pb-24 text-slate-100">
      {/* Top Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-800/80 bg-[#0b0f19]/90 px-5 py-3 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
          <h2 className="text-sm font-bold text-white">Categories</h2>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-teal-500 text-slate-950 text-xs font-bold hover:bg-teal-400 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Category</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="px-5 pt-3">
        <div className="grid grid-cols-2 gap-1 p-1 bg-slate-900 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('expense')}
            className={`py-2 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'expense'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Expense Categories ({dbState.categories.filter((c) => c.type === 'expense').length})
          </button>
          <button
            onClick={() => setActiveTab('income')}
            className={`py-2 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'income'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Income Categories ({dbState.categories.filter((c) => c.type === 'income').length})
          </button>
        </div>
      </div>

      {/* Category List */}
      <div className="px-5 pt-4 space-y-2.5">
        {categories.map((cat) => {
          const usageCount = dbState.transactions.filter((t) => t.categoryId === cat.id).length;

          return (
            <div
              key={cat.id}
              className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                cat.isHidden
                  ? 'bg-slate-950/40 border-slate-800/40 opacity-50'
                  : 'bg-slate-900/80 border-slate-800/80'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${cat.color}25`, color: cat.color }}
                >
                  <CategoryIcon name={cat.icon} size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{cat.name}</span>
                    {cat.isHidden && (
                      <span className="text-[10px] text-slate-500">(Hidden from new add)</span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {usageCount} transaction{usageCount === 1 ? '' : 's'} recorded
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleToggleHide(cat)}
                  title={cat.isHidden ? 'Unhide category' : 'Hide category'}
                  className="h-8 w-8 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white flex items-center justify-center"
                >
                  {cat.isHidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>

                <button
                  onClick={() => openEditModal(cat)}
                  title="Edit category"
                  className="h-8 w-8 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white flex items-center justify-center"
                >
                  <Edit2 className="h-4 w-4" />
                </button>

                <button
                  onClick={() => confirmDeleteCategory(cat)}
                  title="Delete category"
                  className="h-8 w-8 rounded-lg text-slate-400 hover:bg-rose-500/20 hover:text-rose-400 flex items-center justify-center"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
          <div className="w-full max-w-sm rounded-t-3xl sm:rounded-3xl bg-[#111827] border border-slate-800 text-slate-100 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <span className="font-bold text-sm text-white">
                {editingCategory ? 'Edit Category' : 'Create Category'}
              </span>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Category Name</label>
                <input
                  type="text"
                  placeholder="e.g. Subscriptions, Tuition, Groceries"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  required
                  className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              {/* Color Selector */}
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1.5">Color</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORY_COLORS.map((col) => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setCatColor(col)}
                      className={`h-7 w-7 rounded-full transition-transform ${
                        catColor === col ? 'scale-125 ring-2 ring-white' : 'opacity-80 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: col }}
                    />
                  ))}
                </div>
              </div>

              {/* Icon Selector */}
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1.5">Icon</label>
                <div className="grid grid-cols-7 gap-1.5 max-h-36 overflow-y-auto p-1 bg-slate-900 rounded-xl border border-slate-800">
                  {AVAILABLE_ICONS.map((iconName) => (
                    <button
                      key={iconName}
                      type="button"
                      onClick={() => setCatIcon(iconName)}
                      className={`h-9 w-9 rounded-lg flex items-center justify-center transition-all ${
                        catIcon === iconName
                          ? 'bg-teal-500/20 text-teal-300 border border-teal-500/50'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      <CategoryIcon name={iconName} size={16} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${catColor}25`, color: catColor }}
                >
                  <CategoryIcon name={catIcon} size={20} />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">{catName || 'Preview Name'}</span>
                  <span className="text-[10px] text-slate-400 capitalize">{activeTab} Category</span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 transition-all shadow-md shadow-teal-500/20"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Deletion Reassignment Modal */}
      {deleteCat && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
          <div className="w-full max-w-sm rounded-t-3xl sm:rounded-3xl bg-[#111827] border border-slate-800 text-slate-100 p-6 shadow-2xl">
            <div className="flex items-center gap-2 text-amber-400 mb-2">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-bold text-sm text-white">Reassign Category Records</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              "{deleteCat.name}" is used in historical records. How would you like to handle existing transactions?
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">
                  Reassign existing records to:
                </label>
                <select
                  value={reassignToId}
                  onChange={(e) => setReassignToId(e.target.value)}
                  className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-white focus:outline-none"
                >
                  {categories.filter((c) => c.id !== deleteCat.id).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <button
                  onClick={() => executeDeleteReassign(true)}
                  className="w-full py-2.5 rounded-xl bg-teal-500 text-slate-950 text-xs font-bold hover:bg-teal-400"
                >
                  Reassign Records & Delete Category
                </button>

                <button
                  onClick={() => executeDeleteReassign(false)}
                  className="w-full py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700"
                >
                  Keep Records as Uncategorized & Delete
                </button>

                <button
                  onClick={() => setDeleteCat(null)}
                  className="w-full py-2 text-xs text-slate-500 hover:text-white"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
