# Codebase Context & Navigation

> AI dùng folder này để hiểu codebase.

---

## 🌟 Primary: Codegraph (MCP — Khuyên dùng)

Knowledge Graph tự động. AI dùng qua MCP tools, không cần đọc file thủ công.

```bash
# Cài đặt (1 lần duy nhất)
npm install -g @colbymchenry/codegraph && codegraph init

# Thủ công build/re-index toàn bộ project
codegraph index

# Xem trạng thái graph & thống kê
codegraph status

# Tìm kiếm ký hiệu trong codebase
codegraph query "search_term"
```

### MCP Tools (AI tự dùng):
| Tool | Chức năng |
|------|----------|
| `codegraph_context` | Lấy đúng files cần thiết cho task / Kiến trúc tổng quan |
| `codegraph_explore` | Khi sửa file A, biết file nào bị ảnh hưởng |
| `codegraph_search` | Tìm function/class theo tên |

---

## Config
- `.mcp.json` — MCP server config cho codegraph
