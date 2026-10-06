import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import path from 'path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1')), '..');
const sourceCss = readFileSync(path.join(root, 'public', 'source-layout.css'), 'utf8');

const adminCss = `
/* ════════════════════════════════════════════════════════════════
   ADMIN DASHBOARD STYLES
   ════════════════════════════════════════════════════════════════ */
.admin-shell {
  display: flex;
  min-height: 100vh;
  background: #f4f5f8;
  font-family: Poppins, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif;
  color: #1a1b24;
}
.admin-sidebar {
  width: 260px;
  background: #171a35;
  color: #c9cbd7;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  border-right: 1px solid #232747;
}
.admin-brand {
  padding: 24px 20px;
  border-bottom: 1px solid #232747;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.admin-brand strong {
  color: #ffffff;
  font-size: 1.15rem;
  letter-spacing: -0.02em;
}
.admin-brand span {
  font-size: 0.72rem;
  background: #fd546c;
  color: #ffffff;
  padding: 2px 7px;
  border-radius: 999px;
  font-weight: 600;
  text-transform: uppercase;
}
.admin-nav {
  padding: 16px 10px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.admin-nav a {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-radius: 8px;
  color: #a3a7ba;
  font-size: 0.88rem;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.15s ease;
}
.admin-nav a:hover {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.06);
}
.admin-nav a.active {
  color: #ffffff;
  background: #3349b5;
  font-weight: 600;
}
.admin-nav a svg {
  width: 18px;
  height: 18px;
  stroke: currentColor;
  stroke-width: 2;
  fill: none;
}
.admin-footer-nav {
  padding: 16px;
  border-top: 1px solid #232747;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.admin-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow-y: auto;
}
.admin-header {
  background: #ffffff;
  border-bottom: 1px solid #e6e7ec;
  padding: 16px 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}
.admin-header h1 {
  font-size: 1.35rem;
  margin: 0;
  font-weight: 700;
  color: #171a35;
}
.admin-content {
  padding: 32px;
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;
}
.admin-card {
  background: #ffffff;
  border-radius: 14px;
  border: 1px solid #e6e7ec;
  box-shadow: 0 2px 8px rgba(0,0,0,0.03);
  padding: 24px;
  margin-bottom: 24px;
}
.admin-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}
.admin-card-title {
  font-size: 1.12rem;
  font-weight: 700;
  margin: 0;
  color: #171a35;
}
.stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 20px;
  margin-bottom: 28px;
}
.stat-card {
  background: #ffffff;
  border: 1px solid #e6e7ec;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.03);
}
.stat-label {
  color: #69707d;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.stat-val {
  font-size: 1.9rem;
  font-weight: 700;
  color: #171a35;
}
.stat-desc {
  font-size: 0.78rem;
  color: #8c93a4;
}
.admin-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.88rem;
}
.admin-table th {
  text-align: left;
  padding: 12px 14px;
  background: #f9f9fb;
  color: #69707d;
  font-weight: 600;
  border-bottom: 1px solid #e6e7ec;
  white-space: nowrap;
}
.admin-table td {
  padding: 14px;
  border-bottom: 1px solid #f0f0f4;
  vertical-align: middle;
}
.admin-table tr:hover td {
  background: #fafbfe;
}
.badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
}
.badge-published { background: #e6f7ed; color: #027a48; }
.badge-draft { background: #fff4e5; color: #b54708; }
.badge-planned { background: #eff4ff; color: #2e62e9; }
.badge-archived { background: #f2f4f7; color: #475467; }
.badge-gift { background: #fdf2fa; color: #c11574; }
.badge-blog { background: #f0f9ff; color: #026aa2; }
.badge-page { background: #f4f3ff; color: #5925dc; }
.btn-primary {
  background: #3349b5;
  color: #ffffff;
  border: none;
  padding: 9px 16px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.88rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  text-decoration: none;
}
.btn-primary:hover { background: #25368f; }
.btn-secondary {
  background: #ffffff;
  color: #344054;
  border: 1px solid #d0d5dd;
  padding: 9px 16px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.88rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  text-decoration: none;
}
.btn-secondary:hover { background: #f9fafb; }
.btn-danger {
  background: #fee4e2;
  color: #b42318;
  border: 1px solid #fecdca;
  padding: 8px 14px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.84rem;
  cursor: pointer;
}
.btn-danger:hover { background: #fecdca; }
.form-group {
  margin-bottom: 20px;
}
.form-label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  color: #344054;
  margin-bottom: 6px;
}
.form-input, .form-textarea, .form-select {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #d0d5dd;
  border-radius: 8px;
  font-size: 0.9rem;
  color: #101828;
  background: #ffffff;
  outline: none;
  font-family: inherit;
  box-sizing: border-box;
}
.form-input:focus, .form-textarea:focus, .form-select:focus {
  border-color: #3349b5;
  box-shadow: 0 0 0 3px rgba(51, 73, 181, 0.15);
}
.form-textarea { min-height: 120px; resize: vertical; }
.form-hint { font-size: 0.76rem; color: #667085; margin-top: 4px; }
.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 18px;
}
.admin-item-card {
  border: 1px solid #e6e7ec;
  border-radius: 10px;
  padding: 16px;
  margin-bottom: 16px;
  background: #fafafc;
}
.admin-search-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}
.admin-tabs {
  display: flex;
  gap: 8px;
  border-bottom: 1px solid #e6e7ec;
  margin-bottom: 24px;
}
.admin-tab {
  padding: 10px 18px;
  font-size: 0.88rem;
  font-weight: 600;
  color: #69707d;
  border-bottom: 2px solid transparent;
  text-decoration: none;
  cursor: pointer;
  background: none;
  border-top: none;
  border-left: none;
  border-right: none;
}
.admin-tab.active {
  color: #3349b5;
  border-bottom-color: #3349b5;
}
`;

mkdirSync(path.join(root, 'app'), { recursive: true });
const output = '@import url("https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap");\n\n' + sourceCss + '\n\n' + adminCss;
writeFileSync(path.join(root, 'app', 'globals.css'), output);
console.log('app/globals.css built successfully!');
