# 社区功能改进说明

## 本次更新内容

### 1. ✅ 举报功能

新增了作品举报功能，用户可以举报不当内容，帮助维护社区环境。

#### API 接口

**举报作品**
```http
POST /api/community/works/:work_id/report
Content-Type: application/json
Cookie: session=xxx

{
  "reason": "inappropriate_content",  // 必填：举报原因
  "description": "这篇作品包含不当言论"  // 可选：详细描述（最多 500 字）
}
```

**举报原因枚举：**
| 原因代码 | 中文说明 |
|---------|---------|
| `inappropriate_content` | 包含不当内容 |
| `violence` | 包含暴力内容 |
| `adult_content` | 包含成人内容 |
| `plagiarism` | 疑似抄袭 |
| `harassment` | 人身攻击/骚扰 |
| `spam` | 垃圾信息 |
| `other` | 其他原因 |

**查询我的举报状态**
```http
GET /api/community/works/:work_id/report
Cookie: session=xxx
```

#### 限制规则
- 每个用户对同一作品只能举报一次
- 不能举报自己的作品
- 频率限制：5 次/小时
- 举报记录永久保存，计入合规日志

#### 数据库模型

新增 `WorkReport` 表：
```python
class WorkReport(db.Model):
    id              # 举报 ID
    work_id         # 作品 ID
    user_id         # 举报人 ID
    reason          # 举报原因（枚举值）
    description     # 详细描述（可选）
    status          # pending/reviewing/resolved/rejected
    handler_notes   # 处理备注
    reviewed_at     # 处理时间
    reviewed_by     # 处理人
    created_at      # 举报时间
```

---

### 2. ✅ 隐私保护增强

#### 改进内容

**1. 用户 ID 脱敏**
- 作品列表和详情页不再暴露 `user_id`
- 评论列表不再暴露 `user_id`
- 防止通过遍历用户 ID 获取个人信息

**2. 小学作品年级模糊**
- 小学生作品显示为"小学 X 年级"而非具体年级
- 避免精确定位到特定年龄段
- 中学生作品正常显示年级

**3. 作者匿名化**
- 所有作品作者统一显示为"匿名同学"
- 只公开学段信息（小学/初中/高中）

#### API 响应变化

**修改前：**
```json
{
  "work": {
    "user_id": 123,
    "author_grade": 4,
    "author_school_stage": "elementary"
  }
}
```

**修改后：**
```json
{
  "work": {
    "author": {
      "nickname": "匿名同学",
      "school_stage": "elementary",
      "grade_text": "小学 4 年级"
    }
  }
}
```

---

## 待实现功能（建议）

### 高优先级

#### 1. 审核管理后台
需要新增管理员审核功能：

```python
# routes/admin.py
@admin_bp.route('/works/pending')
@admin_required
def pending_works():
    """待审核作品列表"""

@admin_bp.route('/works/<int:work_id>/review', methods=['POST'])
@admin_required
def review_work(work_id):
    """审核作品（通过/驳回）"""
    # 支持操作：approve（通过）, reject（驳回）, needs_revision（需修改）
```

#### 2. 评论频率限制
当前评论无频率限制，建议添加：
```python
@community_bp.route('/works/<int:work_id>/comment', methods=['POST'])
@login_required
@limiter.limit("5 per minute")
def comment_work(work_id):
    # ...
```

#### 3. 举报处理流程
需要实现管理员处理举报的功能：
```python
@admin_bp.route('/reports/pending')
@admin_required
def pending_reports():
    """待处理举报列表"""

@admin_bp.route('/reports/<int:report_id>/resolve', methods=['POST'])
@admin_required
def resolve_report(report_id):
    """处理举报（下架作品/驳回举报）"""
```

---

## 测试方法

### 运行测试
```bash
# 测试举报功能和隐私保护
python -m pytest tests/test_community_report.py -v

# 测试现有社区功能
python -m pytest tests/test_community.py -v
```

### 手动测试

**测试举报功能：**
```bash
# 1. 登录
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "test_student", "password": "Passw0rd123"}' \
  -c cookies.txt

# 2. 举报作品
curl -X POST http://localhost:5000/api/community/works/1/report \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"reason": "spam", "description": "这是垃圾信息"}'

# 3. 查询举报状态
curl -X GET http://localhost:5000/api/community/works/1/report \
  -b cookies.txt
```

**测试隐私保护：**
```bash
# 查看作品列表（检查是否脱敏）
curl -X GET http://localhost:5000/api/community/works

# 查看作品详情（检查年级模糊处理）
curl -X GET http://localhost:5000/api/community/works/1
```

---

## 数据库迁移

运行以下命令创建新的举报表：
```bash
python init_db.py
```

或使用 Flask 迁移工具（如果已配置）：
```bash
flask db migrate -m "Add work reports table"
flask db upgrade
```

---

## 相关文件

### 修改的文件
- `models/community.py` - 新增 `WorkReport` 模型
- `routes/community.py` - 新增举报路由，改进隐私保护序列化
- `app.py` - 确保新模型注册

### 新增的文件
- `tests/test_community_report.py` - 举报功能和隐私保护测试

---

## 下一步建议

1. **实现审核后台** - 管理员可以审核作品和处理举报
2. **添加通知系统** - 举报处理结果通知举报人
3. **统计数据面板** - 展示举报处理情况、社区健康度
4. **自动下架机制** - 被举报多次的作品自动下架待审
5. **信用积分系统** - 恶意举报扣分，有效举报加分
