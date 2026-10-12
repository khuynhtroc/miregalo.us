'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { Category } from '@/lib/types';

export interface CompactGiftGuide {
  id: string;
  title: string;
  slug: string;
  status: string;
  primary_category_id: string | null;
  category_ids: string[];
  hero_image: string;
  focus_keyword: string;
  excerpt: string;
  published_at: string | null;
  updated_at: string;
  created_at: string;
  itemCount: number;
  faqCount: number;
  priceRange: string;
}

export interface CompactScheduledJob {
  id: string;
  topic: string;
  target_path: string;
  cluster: string;
  silo: string;
  scheduled_for: string | null;
  model: string;
  min_words: number;
  status: string;
  image_model?: string;
  affiliate_tag?: string;
}

interface GiftGuidesClientProps {
  initialGuides: CompactGiftGuide[];
  scheduledJobs: CompactScheduledJob[];
  categories: Category[];
}

export function GiftGuidesClient({
  initialGuides,
  scheduledJobs,
  categories,
}: GiftGuidesClientProps) {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'guides' | 'scheduled' | 'categories'>('guides');

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [datePreset, setDatePreset] = useState<'all' | '7d' | '30d' | 'custom'>('all');
  const [publishedFrom, setPublishedFrom] = useState('');
  const [publishedTo, setPublishedTo] = useState('');
  const [updatedPreset, setUpdatedPreset] = useState<'all' | '7d' | '30d'>('all');
  const [itemCountFilter, setItemCountFilter] = useState<'all' | 'heavy' | 'medium' | 'light'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'oldest' | 'updated' | 'items_desc' | 'items_asc' | 'title_asc'>('recent');

  // Scheduled tab search & filter
  const [scheduledSearch, setScheduledSearch] = useState('');
  const [scheduledSilo, setScheduledSilo] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Quick preview modal
  const [previewGuide, setPreviewGuide] = useState<CompactGiftGuide | null>(null);

  // Category map for quick name lookup
  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>();
    for (const c of categories) {
      map.set(c.id, c);
    }
    return map;
  }, [categories]);

  // Guides count by category
  const categoryGuideCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const g of initialGuides) {
      if (g.primary_category_id) {
        counts[g.primary_category_id] = (counts[g.primary_category_id] || 0) + 1;
      }
      for (const cid of g.category_ids || []) {
        if (cid !== g.primary_category_id) {
          counts[cid] = (counts[cid] || 0) + 1;
        }
      }
    }
    return counts;
  }, [initialGuides]);

  // Filtered and sorted gift guides
  const filteredGuides = useMemo(() => {
    const now = new Date();
    const q = searchQuery.toLowerCase().trim();

    return initialGuides.filter((guide) => {
      // 1. Text search
      if (q) {
        const matchesTitle = guide.title.toLowerCase().includes(q);
        const matchesSlug = guide.slug.toLowerCase().includes(q);
        const matchesKw = guide.focus_keyword?.toLowerCase().includes(q);
        const matchesExcerpt = guide.excerpt?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesSlug && !matchesKw && !matchesExcerpt) {
          return false;
        }
      }

      // 2. Category filter
      if (selectedCategory) {
        const inPrimary = guide.primary_category_id === selectedCategory;
        const inSecondary = guide.category_ids?.includes(selectedCategory);
        if (!inPrimary && !inSecondary) return false;
      }

      // 3. Status filter
      if (selectedStatus && guide.status !== selectedStatus) {
        return false;
      }

      // 4. Published date filter
      const pubDate = guide.published_at ? new Date(guide.published_at) : null;
      if (datePreset === '7d' && pubDate) {
        const diffDays = (now.getTime() - pubDate.getTime()) / (1000 * 3600 * 24);
        if (diffDays > 7 || diffDays < 0) return false;
      } else if (datePreset === '30d' && pubDate) {
        const diffDays = (now.getTime() - pubDate.getTime()) / (1000 * 3600 * 24);
        if (diffDays > 30 || diffDays < 0) return false;
      } else if (datePreset === 'custom') {
        if (publishedFrom && pubDate && pubDate < new Date(publishedFrom)) return false;
        if (publishedTo && pubDate) {
          const end = new Date(publishedTo);
          end.setHours(23, 59, 59, 999);
          if (pubDate > end) return false;
        }
      }

      // 5. Updated date filter
      const updDate = guide.updated_at ? new Date(guide.updated_at) : null;
      if (updatedPreset === '7d' && updDate) {
        const diffDays = (now.getTime() - updDate.getTime()) / (1000 * 3600 * 24);
        if (diffDays > 7 || diffDays < 0) return false;
      } else if (updatedPreset === '30d' && updDate) {
        const diffDays = (now.getTime() - updDate.getTime()) / (1000 * 3600 * 24);
        if (diffDays > 30 || diffDays < 0) return false;
      }

      // 6. Items count filter
      if (itemCountFilter === 'heavy' && guide.itemCount < 20) return false;
      if (itemCountFilter === 'medium' && (guide.itemCount < 10 || guide.itemCount >= 20)) return false;
      if (itemCountFilter === 'light' && guide.itemCount >= 10) return false;

      return true;
    }).sort((a, b) => {
      if (sortBy === 'recent') {
        const da = a.published_at ? new Date(a.published_at).getTime() : 0;
        const db = b.published_at ? new Date(b.published_at).getTime() : 0;
        return db - da;
      }
      if (sortBy === 'oldest') {
        const da = a.published_at ? new Date(a.published_at).getTime() : 0;
        const db = b.published_at ? new Date(b.published_at).getTime() : 0;
        return da - db;
      }
      if (sortBy === 'updated') {
        const da = a.updated_at ? new Date(a.updated_at).getTime() : 0;
        const db = b.updated_at ? new Date(b.updated_at).getTime() : 0;
        return db - da;
      }
      if (sortBy === 'items_desc') {
        return b.itemCount - a.itemCount;
      }
      if (sortBy === 'items_asc') {
        return a.itemCount - b.itemCount;
      }
      if (sortBy === 'title_asc') {
        return a.title.localeCompare(b.title, 'es');
      }
      return 0;
    });
  }, [
    initialGuides,
    searchQuery,
    selectedCategory,
    selectedStatus,
    datePreset,
    publishedFrom,
    publishedTo,
    updatedPreset,
    itemCountFilter,
    sortBy,
  ]);

  // Paginated slice
  const totalPages = Math.ceil(filteredGuides.length / pageSize) || 1;
  const paginatedGuides = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredGuides.slice(start, start + pageSize);
  }, [filteredGuides, currentPage, pageSize]);

  // Filtered scheduled jobs
  const filteredScheduledJobs = useMemo(() => {
    const q = scheduledSearch.toLowerCase().trim();
    return scheduledJobs.filter((job) => {
      if (q && !job.topic.toLowerCase().includes(q) && !job.id.toLowerCase().includes(q) && !job.cluster.toLowerCase().includes(q)) {
        return false;
      }
      if (scheduledSilo && job.silo !== scheduledSilo) {
        return false;
      }
      return true;
    });
  }, [scheduledJobs, scheduledSearch, scheduledSilo]);

  // Reset all filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedStatus('');
    setDatePreset('all');
    setPublishedFrom('');
    setPublishedTo('');
    setUpdatedPreset('all');
    setItemCountFilter('all');
    setSortBy('recent');
    setCurrentPage(1);
  };

  // Export filtered items to CSV
  const handleExportCSV = () => {
    const headers = [
      'ID',
      'Title',
      'Slug',
      'Canonical URL',
      'Primary Category',
      'Status',
      'Items Count',
      'Price Range',
      'Published At',
      'Updated At',
      'Focus Keyword',
    ];

    const rows = filteredGuides.map((g) => {
      const cat = g.primary_category_id ? categoryMap.get(g.primary_category_id)?.name || '' : '';
      return [
        g.id,
        `"${g.title.replace(/"/g, '""')}"`,
        g.slug,
        `https://www.miregalo.us/${g.slug}/`,
        `"${cat.replace(/"/g, '""')}"`,
        g.status,
        g.itemCount,
        `"${g.priceRange}"`,
        g.published_at || '',
        g.updated_at || '',
        `"${(g.focus_keyword || '').replace(/"/g, '""')}"`,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `miregalo-gift-guides-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Format date helper
  const formatDateStr = (dateString?: string | null) => {
    if (!dateString) return '—';
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const hasActiveFilters = Boolean(
    searchQuery ||
    selectedCategory ||
    selectedStatus ||
    datePreset !== 'all' ||
    updatedPreset !== 'all' ||
    itemCountFilter !== 'all' ||
    sortBy !== 'recent'
  );

  return (
    <div>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 700, margin: 0, color: '#171a35' }}>
              Gift Guides Hub 🎁
            </h1>
            <span
              style={{
                fontSize: '0.8rem',
                fontWeight: 600,
                background: '#e0e7ff',
                color: '#3730a3',
                padding: '3px 10px',
                borderRadius: '999px',
              }}
            >
              {initialGuides.length} bài viết
            </span>
          </div>
          <p style={{ margin: '4px 0 0', color: '#69707d', fontSize: '0.92rem' }}>
            Quản lý tập trung toàn bộ các bài viết Guía de Regalos (như{' '}
            <Link href="/para-hombres/" target="_blank" style={{ color: '#4f46e5', fontWeight: 600, textDecoration: 'none' }}>
              /para-hombres/ ↗
            </Link>
            ), bộ lọc chuyên mục, ngày đăng, cập nhật, sản phẩm affiliate và hàng đợi hẹn lịch AI.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={handleExportCSV}
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            title="Xuất danh sách hiện tại ra file CSV"
          >
            <span>📥</span> Xuất CSV ({filteredGuides.length})
          </button>
          <Link
            href="/admin/generator/"
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <span>⚡</span> AI Generator Studio
          </Link>
          <Link
            href="/admin/posts/new/?type=gift"
            className="btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <span>+</span> Tạo Gift Guide Mới
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="stat-grid" style={{ marginBottom: '22px' }}>
        <div className="stat-card">
          <span className="stat-label">Tổng số Gift Guides</span>
          <span className="stat-val" style={{ color: '#1e293b' }}>{initialGuides.length}</span>
          <span className="stat-desc">Định dạng sản phẩm tuyển chọn</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Đang xuất bản (Live)</span>
          <span className="stat-val" style={{ color: '#059669' }}>
            {initialGuides.filter((g) => g.status === 'published').length}
          </span>
          <span className="stat-desc">100% online trên Canonical URLs</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Hàng đợi Hẹn lịch AI</span>
          <span className="stat-val" style={{ color: '#7c3aed' }}>{scheduledJobs.length}</span>
          <span className="stat-desc">Chuẩn từ khóa "ideas de regalos..."</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Tổng sản phẩm tuyển chọn</span>
          <span className="stat-val" style={{ color: '#2563eb' }}>
            {initialGuides.reduce((sum, g) => sum + g.itemCount, 0).toLocaleString()}
          </span>
          <span className="stat-desc">Cards có link &amp; giá affiliate</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">TB Sản phẩm / Bài</span>
          <span className="stat-val" style={{ color: '#d97706' }}>
            {Math.round(initialGuides.reduce((sum, g) => sum + g.itemCount, 0) / (initialGuides.length || 1))} món
          </span>
          <span className="stat-desc">Khoảng giá $15 – $120</span>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div
        style={{
          display: 'flex',
          gap: '4px',
          borderBottom: '2px solid #e2e8f0',
          marginBottom: '20px',
        }}
      >
        <button
          onClick={() => setActiveTab('guides')}
          style={{
            padding: '11px 18px',
            fontSize: '0.92rem',
            fontWeight: activeTab === 'guides' ? 700 : 500,
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            color: activeTab === 'guides' ? '#4f46e5' : '#64748b',
            borderBottom: activeTab === 'guides' ? '3px solid #4f46e5' : '3px solid transparent',
            marginBottom: '-2px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span>🎁</span> Guías de Regalos ({initialGuides.length})
        </button>

        <button
          onClick={() => setActiveTab('scheduled')}
          style={{
            padding: '11px 18px',
            fontSize: '0.92rem',
            fontWeight: activeTab === 'scheduled' ? 700 : 500,
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            color: activeTab === 'scheduled' ? '#4f46e5' : '#64748b',
            borderBottom: activeTab === 'scheduled' ? '3px solid #4f46e5' : '3px solid transparent',
            marginBottom: '-2px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span>⏰</span> Hàng đợi Hẹn lịch AI ({scheduledJobs.length})
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          style={{
            padding: '11px 18px',
            fontSize: '0.92rem',
            fontWeight: activeTab === 'categories' ? 700 : 500,
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            color: activeTab === 'categories' ? '#4f46e5' : '#64748b',
            borderBottom: activeTab === 'categories' ? '3px solid #4f46e5' : '3px solid transparent',
            marginBottom: '-2px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span>📊</span> Phân bổ theo Chuyên mục ({categories.length})
        </button>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 1: GUIDES LIST & COMPREHENSIVE FILTERS */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'guides' && (
        <>
          {/* Multi-Dimensional Filter Box */}
          <div
            className="admin-card"
            style={{
              padding: '20px',
              marginBottom: '20px',
              background: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
          >
            {/* Row 1: Search & Core Selects */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '12px', marginBottom: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                  🔍 Tìm kiếm (Tiêu đề, Slug, Từ khóa)
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="form-input"
                  placeholder="Ví dụ: para hombres, novio, navidad..."
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                  🗂️ Chuyên mục ({categories.length})
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="form-select"
                  style={{ width: '100%' }}
                >
                  <option value="">Tất cả chuyên mục ({initialGuides.length})</option>
                  {categories.map((c) => {
                    const count = categoryGuideCounts[c.id] || 0;
                    return (
                      <option key={c.id} value={c.id}>
                        [{c.group.toUpperCase()}] {c.name} ({count})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                  📌 Trạng thái bài viết
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => {
                    setSelectedStatus(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="form-select"
                  style={{ width: '100%' }}
                >
                  <option value="">Tất cả trạng thái</option>
                  <option value="published">Đã xuất bản (Published)</option>
                  <option value="draft">Bản nháp (Draft)</option>
                  <option value="scheduled">Lên lịch (Scheduled)</option>
                  <option value="planned">Kế hoạch (Planned)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                  🛍️ Số lượng sản phẩm tuyển chọn
                </label>
                <select
                  value={itemCountFilter}
                  onChange={(e) => {
                    setItemCountFilter(e.target.value as any);
                    setCurrentPage(1);
                  }}
                  className="form-select"
                  style={{ width: '100%' }}
                >
                  <option value="all">Tất cả bài viết</option>
                  <option value="heavy">Nhiều sản phẩm (≥ 20 món)</option>
                  <option value="medium">Tiêu chuẩn (10 – 19 món)</option>
                  <option value="light">Ngắn gọn (&lt; 10 món)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                  ⚡ Sắp xếp theo
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="form-select"
                  style={{ width: '100%' }}
                >
                  <option value="recent">Ngày đăng mới nhất</option>
                  <option value="oldest">Ngày đăng cũ nhất</option>
                  <option value="updated">Mới cập nhật gần đây</option>
                  <option value="items_desc">Nhiều sản phẩm nhất</option>
                  <option value="items_asc">Ít sản phẩm nhất</option>
                  <option value="title_asc">Tiêu đề (A → Z)</option>
                </select>
              </div>
            </div>

            {/* Row 2: Date Filters & Preset Buttons */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
                paddingTop: '12px',
                borderTop: '1px dashed #e2e8f0',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>
                  📅 Ngày xuất bản:
                </span>
                <button
                  type="button"
                  onClick={() => setDatePreset('all')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    border: '1px solid #cbd5e1',
                    background: datePreset === 'all' ? '#4f46e5' : '#ffffff',
                    color: datePreset === 'all' ? '#ffffff' : '#334155',
                    fontWeight: datePreset === 'all' ? 600 : 500,
                  }}
                >
                  Tất cả
                </button>
                <button
                  type="button"
                  onClick={() => setDatePreset('7d')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    border: '1px solid #cbd5e1',
                    background: datePreset === '7d' ? '#4f46e5' : '#ffffff',
                    color: datePreset === '7d' ? '#ffffff' : '#334155',
                    fontWeight: datePreset === '7d' ? 600 : 500,
                  }}
                >
                  7 ngày qua
                </button>
                <button
                  type="button"
                  onClick={() => setDatePreset('30d')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    border: '1px solid #cbd5e1',
                    background: datePreset === '30d' ? '#4f46e5' : '#ffffff',
                    color: datePreset === '30d' ? '#ffffff' : '#334155',
                    fontWeight: datePreset === '30d' ? 600 : 500,
                  }}
                >
                  30 ngày qua
                </button>
                <button
                  type="button"
                  onClick={() => setDatePreset('custom')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    border: '1px solid #cbd5e1',
                    background: datePreset === 'custom' ? '#4f46e5' : '#ffffff',
                    color: datePreset === 'custom' ? '#ffffff' : '#334155',
                    fontWeight: datePreset === 'custom' ? 600 : 500,
                  }}
                >
                  Tùy chọn ngày
                </button>

                {datePreset === 'custom' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '6px' }}>
                    <input
                      type="date"
                      value={publishedFrom}
                      onChange={(e) => {
                        setPublishedFrom(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="form-input"
                      style={{ padding: '3px 8px', fontSize: '0.78rem' }}
                    />
                    <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>đến</span>
                    <input
                      type="date"
                      value={publishedTo}
                      onChange={(e) => {
                        setPublishedTo(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="form-input"
                      style={{ padding: '3px 8px', fontSize: '0.78rem' }}
                    />
                  </div>
                )}
              </div>

              {/* Updated filter pill */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>
                  🔄 Cập nhật:
                </span>
                <select
                  value={updatedPreset}
                  onChange={(e) => {
                    setUpdatedPreset(e.target.value as any);
                    setCurrentPage(1);
                  }}
                  className="form-select"
                  style={{ padding: '3px 8px', fontSize: '0.78rem' }}
                >
                  <option value="all">Mọi thời điểm</option>
                  <option value="7d">Cập nhật 7 ngày qua</option>
                  <option value="30d">Cập nhật 30 ngày qua</option>
                </select>

                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    style={{
                      background: '#fef2f2',
                      border: '1px solid #fecaca',
                      color: '#dc2626',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    ✕ Xóa toàn bộ bộ lọc
                  </button>
                )}
              </div>
            </div>

            {/* Active filter summary feedback */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px', fontSize: '0.82rem', color: '#64748b' }}>
              <div>
                Đang hiển thị <strong>{filteredGuides.length}</strong> bài viết phù hợp (trên tổng số {initialGuides.length} bài)
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>Hiển thị mỗi trang:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  style={{ padding: '2px 6px', fontSize: '0.8rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>
          </div>

          {/* Interactive Guides Table */}
          <div className="admin-card" style={{ padding: 0, overflow: 'hidden', marginBottom: '22px' }}>
            <div style={{ overflowX: 'auto' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ minWidth: '340px' }}>Ảnh &amp; Tiêu đề Guía de Regalos</th>
                    <th style={{ minWidth: '150px' }}>Chuyên mục</th>
                    <th style={{ minWidth: '140px' }}>Sản phẩm &amp; Giá</th>
                    <th style={{ minWidth: '110px' }}>Trạng thái</th>
                    <th style={{ minWidth: '130px' }}>Ngày xuất bản</th>
                    <th style={{ minWidth: '130px' }}>Ngày cập nhật</th>
                    <th style={{ minWidth: '150px', textAlign: 'right' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedGuides.map((guide) => {
                    const primaryCat = guide.primary_category_id ? categoryMap.get(guide.primary_category_id) : null;
                    const canonicalUrl = `https://www.miregalo.us/${guide.slug}/`;

                    return (
                      <tr key={guide.id}>
                        {/* Title & Thumbnail */}
                        <td>
                          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <div
                              style={{
                                width: '76px',
                                height: '48px',
                                flexShrink: 0,
                                borderRadius: '6px',
                                overflow: 'hidden',
                                background: '#f1f5f9',
                                border: '1px solid #e2e8f0',
                                position: 'relative',
                              }}
                            >
                              {guide.hero_image ? (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img
                                  src={guide.hero_image}
                                  alt={guide.title}
                                  loading="lazy"
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                              ) : (
                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                                  🎁
                                </div>
                              )}
                            </div>

                            <div style={{ flex: 1, minWidth: 0 }}>
                              <Link
                                href={`/admin/posts/${guide.id}/`}
                                style={{
                                  fontWeight: 600,
                                  color: '#1e293b',
                                  textDecoration: 'none',
                                  fontSize: '0.92rem',
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                }}
                                title={guide.title}
                              >
                                {guide.title}
                              </Link>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px' }}>
                                <span style={{ fontSize: '0.74rem', color: '#64748b', fontFamily: 'monospace' }}>
                                  /{guide.slug}/
                                </span>
                                {guide.focus_keyword && (
                                  <span
                                    style={{
                                      fontSize: '0.7rem',
                                      background: '#f1f5f9',
                                      color: '#475569',
                                      padding: '1px 6px',
                                      borderRadius: '4px',
                                    }}
                                  >
                                    🎯 {guide.focus_keyword}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td>
                          {primaryCat ? (
                            <div>
                              <span
                                style={{
                                  display: 'inline-block',
                                  fontSize: '0.78rem',
                                  fontWeight: 600,
                                  padding: '3px 8px',
                                  borderRadius: '6px',
                                  background:
                                    primaryCat.group === 'recipients'
                                      ? '#eff6ff'
                                      : primaryCat.group === 'occasions'
                                      ? '#fdf2f8'
                                      : '#f0fdf4',
                                  color:
                                    primaryCat.group === 'recipients'
                                      ? '#1d4ed8'
                                      : primaryCat.group === 'occasions'
                                      ? '#be185d'
                                      : '#15803d',
                                }}
                              >
                                {primaryCat.name}
                              </span>
                              <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '2px' }}>
                                Group: {primaryCat.group}
                              </div>
                            </div>
                          ) : (
                            <span style={{ color: '#94a3b8', fontSize: '0.84rem' }}>Chưa gán</span>
                          )}
                        </td>

                        {/* Products & Price */}
                        <td>
                          <div style={{ fontSize: '0.86rem', fontWeight: 600, color: '#1e293b' }}>
                            🛍️ {guide.itemCount} sản phẩm
                          </div>
                          <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px' }}>
                            {guide.priceRange}
                          </div>
                          {guide.faqCount > 0 && (
                            <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                              ❓ {guide.faqCount} câu hỏi FAQ
                            </div>
                          )}
                        </td>

                        {/* Status */}
                        <td>
                          <span
                            className={`badge badge-${guide.status}`}
                            style={{ textTransform: 'capitalize', fontWeight: 600 }}
                          >
                            {guide.status}
                          </span>
                        </td>

                        {/* Published Date */}
                        <td style={{ fontSize: '0.82rem', color: '#475569' }}>
                          <div>{formatDateStr(guide.published_at)}</div>
                          <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                            {guide.published_at ? new Date(guide.published_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                        </td>

                        {/* Updated Date */}
                        <td style={{ fontSize: '0.82rem', color: '#475569' }}>
                          <div>{formatDateStr(guide.updated_at)}</div>
                          <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                            {guide.updated_at ? new Date(guide.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                        </td>

                        {/* Actions */}
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', alignItems: 'center' }}>
                            <button
                              type="button"
                              onClick={() => setPreviewGuide(guide)}
                              title="Xem nhanh chi tiết bài viết"
                              style={{
                                background: '#f8fafc',
                                border: '1px solid #e2e8f0',
                                padding: '4px 8px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '0.78rem',
                                color: '#475569',
                              }}
                            >
                              👁️ Xem
                            </button>

                            <Link
                              href={`/admin/posts/${guide.id}/`}
                              style={{
                                background: '#eff6ff',
                                border: '1px solid #dbeafe',
                                padding: '4px 8px',
                                borderRadius: '6px',
                                fontSize: '0.78rem',
                                fontWeight: 600,
                                color: '#2563eb',
                                textDecoration: 'none',
                              }}
                            >
                              ✏️ Sửa
                            </Link>

                            <a
                              href={canonicalUrl}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                background: '#f0fdf4',
                                border: '1px solid #dcfce7',
                                padding: '4px 8px',
                                borderRadius: '6px',
                                fontSize: '0.78rem',
                                fontWeight: 600,
                                color: '#16a34a',
                                textDecoration: 'none',
                              }}
                              title="Xem bài viết trên web live"
                            >
                              Web ↗
                            </a>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Controls */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '30px',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div style={{ fontSize: '0.84rem', color: '#64748b' }}>
              Hiển thị {(currentPage - 1) * pageSize + 1} – {Math.min(currentPage * pageSize, filteredGuides.length)} trên tổng số {filteredGuides.length} bài
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                type="button"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.82rem', opacity: currentPage === 1 ? 0.5 : 1 }}
              >
                « Đầu
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.82rem', opacity: currentPage === 1 ? 0.5 : 1 }}
              >
                ← Trước
              </button>

              <span style={{ fontSize: '0.88rem', fontWeight: 600, padding: '0 8px', color: '#334155' }}>
                Trang {currentPage} / {totalPages}
              </span>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.82rem', opacity: currentPage >= totalPages ? 0.5 : 1 }}
              >
                Sau →
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage >= totalPages}
                className="btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.82rem', opacity: currentPage >= totalPages ? 0.5 : 1 }}
              >
                Cuối »
              </button>
            </div>
          </div>
        </>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 2: SCHEDULED QUEUE (500 AI GENERATOR JOBS) */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'scheduled' && (
        <>
          <div
            className="admin-card"
            style={{
              padding: '18px',
              marginBottom: '20px',
              background: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
            }}
          >
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ flex: 1, minWidth: '240px' }}>
                <input
                  type="text"
                  value={scheduledSearch}
                  onChange={(e) => setScheduledSearch(e.target.value)}
                  className="form-input"
                  placeholder="🔍 Tìm kiếm từ khóa hẹn lịch (ví dụ: regalos para mamá, navidad, aniversario...)"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ width: '220px' }}>
                <select
                  value={scheduledSilo}
                  onChange={(e) => setScheduledSilo(e.target.value)}
                  className="form-select"
                  style={{ width: '100%' }}
                >
                  <option value="">Tất cả Silos ({scheduledJobs.length})</option>
                  <option value="RECIPIENT">Destinatarios (RECIPIENT)</option>
                  <option value="OCCASION">Ocasiones (OCCASION)</option>
                  <option value="INTEREST">Intereses (INTEREST)</option>
                </select>
              </div>

              {scheduledSearch && (
                <button
                  type="button"
                  onClick={() => setScheduledSearch('')}
                  className="btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '0.82rem' }}
                >
                  Xóa tìm kiếm
                </button>
              )}
            </div>

            <div style={{ marginTop: '12px', padding: '10px 14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ fontSize: '0.84rem', color: '#475569' }}>
                Hiển thị <strong>{filteredScheduledJobs.length}</strong> / {scheduledJobs.length} công việc tạo bài viết Gift Guide tự động theo lịch hẹn.
              </div>
              <Link
                href="/admin/jobs/"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#4f46e5',
                  color: '#ffffff',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                <span>⏰</span> Mở Bảng Hàng Đợi Toàn Diện (/admin/jobs/) →
              </Link>
            </div>
          </div>

          <div className="admin-card" style={{ padding: 0, overflow: 'hidden', marginBottom: '30px' }}>
            <div style={{ overflowX: 'auto' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ minWidth: '110px' }}>Mã Job</th>
                    <th style={{ minWidth: '280px' }}>Từ khóa chủ đề Gift Guide</th>
                    <th style={{ minWidth: '150px' }}>Cụm &amp; Silo</th>
                    <th style={{ minWidth: '180px' }}>Thời gian hẹn lịch</th>
                    <th style={{ minWidth: '150px' }}>Cấu hình AI</th>
                    <th style={{ minWidth: '100px' }}>Trạng thái</th>
                    <th style={{ minWidth: '120px', textAlign: 'right' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredScheduledJobs.map((job) => (
                    <tr key={job.id}>
                      <td>
                        <span style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '0.78rem', color: '#64748b' }}>
                          {job.id}
                        </span>
                      </td>

                      <td>
                        <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.9rem' }}>
                          {job.topic}
                        </div>
                        {job.target_path && (
                          <div style={{ fontSize: '0.74rem', color: '#64748b', fontFamily: 'monospace', marginTop: '2px' }}>
                            {job.target_path}
                          </div>
                        )}
                      </td>

                      <td>
                        <span
                          style={{
                            display: 'inline-block',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            padding: '2px 8px',
                            borderRadius: '6px',
                            background: '#f1f5f9',
                            color: '#334155',
                          }}
                        >
                          {job.cluster}
                        </span>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '2px' }}>
                          Silo: {job.silo}
                        </div>
                      </td>

                      <td style={{ fontSize: '0.82rem', color: '#475569' }}>
                        <div style={{ fontWeight: 500 }}>
                          ⏰ {formatDateStr(job.scheduled_for)}
                        </div>
                        <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                          {job.scheduled_for ? new Date(job.scheduled_for).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </td>

                      <td style={{ fontSize: '0.78rem' }}>
                        <div>🧠 {job.model}</div>
                        <div style={{ color: '#4f46e5', fontWeight: 600 }}>🎁 Gift Guide (~5.000 từ)</div>
                        <div style={{ color: '#64748b', fontSize: '0.72rem' }}>🎨 Imagen 3.0 • 🏷️ {job.affiliate_tag || 'miregalo26-20'}</div>
                      </td>

                      <td>
                        {job.status === 'completed' || job.status === 'published' ? (
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '3px 8px',
                              borderRadius: '999px',
                              fontSize: '0.74rem',
                              fontWeight: 600,
                              background: '#dcfce7',
                              color: '#15803d',
                            }}
                          >
                            ✓ Đã xuất bản
                          </span>
                        ) : job.status === 'generating' || job.status === 'researching' ? (
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '3px 8px',
                              borderRadius: '999px',
                              fontSize: '0.74rem',
                              fontWeight: 600,
                              background: '#fef9c3',
                              color: '#854d0e',
                            }}
                          >
                            ⚙️ Đang tạo bài
                          </span>
                        ) : job.status === 'failed' ? (
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '3px 8px',
                              borderRadius: '999px',
                              fontSize: '0.74rem',
                              fontWeight: 600,
                              background: '#fee2e2',
                              color: '#b91c1c',
                            }}
                          >
                            ❌ Thất bại
                          </span>
                        ) : (
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '3px 8px',
                              borderRadius: '999px',
                              fontSize: '0.74rem',
                              fontWeight: 600,
                              background: '#f3e8ff',
                              color: '#7e22ce',
                            }}
                          >
                            ⏰ Đã lên lịch
                          </span>
                        )}
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <Link
                          href={`/admin/generator/?topic=${encodeURIComponent(job.topic)}&cluster=${encodeURIComponent(job.cluster)}`}
                          style={{
                            background: '#eff6ff',
                            border: '1px solid #dbeafe',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            color: '#2563eb',
                            textDecoration: 'none',
                          }}
                        >
                          ⚡ Chạy ngay
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 3: CATEGORY DISTRIBUTION MATRIX (34 CATEGORIES) */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'categories' && (
        <div style={{ marginBottom: '30px' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '16px',
            }}
          >
            {categories.map((c) => {
              const count = categoryGuideCounts[c.id] || 0;
              const isZero = count === 0;

              return (
                <div
                  key={c.id}
                  className="admin-card"
                  style={{
                    padding: '16px',
                    margin: 0,
                    borderRadius: '10px',
                    border: isZero ? '1px dashed #fca5a5' : '1px solid #e2e8f0',
                    background: isZero ? '#fff5f5' : '#ffffff',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background:
                            c.group === 'recipients'
                              ? '#dbeafe'
                              : c.group === 'occasions'
                              ? '#fce7f3'
                              : '#dcfce7',
                          color:
                            c.group === 'recipients'
                              ? '#1e40af'
                              : c.group === 'occasions'
                              ? '#9d174d'
                              : '#166534',
                        }}
                      >
                        {c.group}
                      </span>

                      <span
                        style={{
                          fontSize: '0.84rem',
                          fontWeight: 700,
                          color: isZero ? '#dc2626' : '#1e293b',
                        }}
                      >
                        {count} bài viết
                      </span>
                    </div>

                    <h3 style={{ margin: '0 0 4px', fontSize: '1.05rem', fontWeight: 600, color: '#1e293b' }}>
                      {c.name}
                    </h3>

                    <div style={{ fontSize: '0.76rem', color: '#64748b', fontFamily: 'monospace' }}>
                      /{c.slug}/
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginTop: '14px', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategory(c.id);
                        setActiveTab('guides');
                        setCurrentPage(1);
                      }}
                      className="btn-secondary"
                      style={{ flex: 1, padding: '5px 8px', fontSize: '0.78rem', justifyContent: 'center' }}
                    >
                      🔍 Lọc {count} bài
                    </button>

                    <a
                      href={`https://www.miregalo.us/${c.slug}/`}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        padding: '5px 10px',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        color: '#4f46e5',
                        background: '#eef2ff',
                        borderRadius: '6px',
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      Xem trang ↗
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* QUICK PREVIEW MODAL */}
      {/* ───────────────────────────────────────────────────────────── */}
      {previewGuide && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
            backdropFilter: 'blur(4px)',
          }}
          onClick={() => setPreviewGuide(null)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              maxWidth: '650px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
              padding: '24px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div style={{ flex: 1 }}>
                <span
                  style={{
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: '#4f46e5',
                    background: '#eef2ff',
                    padding: '2px 8px',
                    borderRadius: '4px',
                  }}
                >
                  Gift Guide Preview
                </span>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '6px 0 0', color: '#1e293b' }}>
                  {previewGuide.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setPreviewGuide(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.4rem',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                ✕
              </button>
            </div>

            {previewGuide.hero_image && (
              <div
                style={{
                  width: '100%',
                  aspectRatio: '16/9',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  marginBottom: '16px',
                  background: '#f1f5f9',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewGuide.hero_image}
                  alt={previewGuide.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px', fontSize: '0.84rem' }}>
              <div>
                <strong style={{ color: '#64748b' }}>Canonical Slug:</strong>
                <div style={{ fontFamily: 'monospace', color: '#1e293b' }}>/{previewGuide.slug}/</div>
              </div>
              <div>
                <strong style={{ color: '#64748b' }}>Chuyên mục:</strong>
                <div>{previewGuide.primary_category_id ? categoryMap.get(previewGuide.primary_category_id)?.name : 'Chưa gán'}</div>
              </div>
              <div>
                <strong style={{ color: '#64748b' }}>Số sản phẩm:</strong>
                <div style={{ color: '#1e293b', fontWeight: 600 }}>🛍️ {previewGuide.itemCount} sản phẩm ({previewGuide.priceRange})</div>
              </div>
              <div>
                <strong style={{ color: '#64748b' }}>Từ khóa SEO:</strong>
                <div style={{ color: '#4f46e5' }}>{previewGuide.focus_keyword || '—'}</div>
              </div>
              <div>
                <strong style={{ color: '#64748b' }}>Ngày xuất bản:</strong>
                <div>{formatDateStr(previewGuide.published_at)}</div>
              </div>
              <div>
                <strong style={{ color: '#64748b' }}>Ngày cập nhật:</strong>
                <div>{formatDateStr(previewGuide.updated_at)}</div>
              </div>
            </div>

            {previewGuide.excerpt && (
              <div style={{ marginBottom: '20px', padding: '12px', background: '#f8fafc', borderRadius: '8px', fontSize: '0.86rem', color: '#475569' }}>
                <strong style={{ display: 'block', marginBottom: '4px', color: '#334155' }}>Trích dẫn:</strong>
                {previewGuide.excerpt}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(`https://www.miregalo.us/${previewGuide.slug}/`);
                  alert('Đã sao chép link canonical vào clipboard!');
                }}
                className="btn-secondary"
                style={{ fontSize: '0.84rem' }}
              >
                📋 Sao chép Link
              </button>

              <a
                href={`https://www.miregalo.us/${previewGuide.slug}/`}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary"
                style={{ fontSize: '0.84rem' }}
              >
                🌐 Xem trên web ↗
              </a>

              <Link
                href={`/admin/posts/${previewGuide.id}/`}
                className="btn-primary"
                style={{ fontSize: '0.84rem' }}
              >
                ✏️ Chỉnh sửa bài viết
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
