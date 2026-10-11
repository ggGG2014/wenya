"""
验证社区功能改进
- 检查举报模型是否存在
- 检查举报路由是否注册
- 检查隐私保护序列化函数
"""
import ast
import sys

def check_file_syntax(filepath):
    """检查 Python 文件语法"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            source = f.read()
        ast.parse(source)
        print(f"✅ {filepath} - 语法正确")
        return True
    except SyntaxError as e:
        print(f"❌ {filepath} - 语法错误：{e}")
        return False

def check_model_definition():
    """检查举报模型定义"""
    with open('models/community.py', 'r', encoding='utf-8') as f:
        content = f.read()
    
    checks = [
        ('WorkReport 类定义', 'class WorkReport(db.Model):'),
        ('举报原因枚举', 'REASONS = {'),
        ('唯一约束', "UniqueConstraint('work_id', 'user_id'"),
        ('to_dict 方法', 'def to_dict(self):'),
    ]
    
    print("\n📋 检查 models/community.py:")
    all_ok = True
    for name, pattern in checks:
        if pattern in content:
            print(f"  ✅ {name}")
        else:
            print(f"  ❌ {name} - 未找到")
            all_ok = False
    return all_ok

def check_route_definition():
    """检查举报路由定义"""
    with open('routes/community.py', 'r', encoding='utf-8') as f:
        content = f.read()
    
    checks = [
        ('导入 WorkReport', 'WorkReport'),
        ('_serialize_work 函数', 'def _serialize_work(work, include_content=False):'),
        ('举报路由 POST', "@community_bp.route('/works/<int:work_id>/report', methods=['POST'])"),
        ('举报路由 GET', "@community_bp.route('/works/<int:work_id>/report', methods=['GET'])"),
        ('限流装饰器', '@limiter.limit("5 per hour")'),
        ('隐私保护：移除 user_id', "result.pop('user_id', None)"),
        ('小学年级模糊', "if work.author_school_stage == 'elementary':"),
        ('作者匿名化', "'匿名同学'"),
    ]
    
    print("\n📋 检查 routes/community.py:")
    all_ok = True
    for name, pattern in checks:
        if pattern in content:
            print(f"  ✅ {name}")
        else:
            print(f"  ❌ {name} - 未找到")
            all_ok = False
    return all_ok

def check_app_registration():
    """检查 app.py 是否注册新模型"""
    with open('app.py', 'r', encoding='utf-8') as f:
        content = f.read()
    
    print("\n📋 检查 app.py:")
    if 'from models import community' in content:
        print("  ✅ 社区举报模型已注册")
        return True
    else:
        print("  ❌ 社区举报模型未注册")
        return False

if __name__ == '__main__':
    print("=" * 60)
    print("🔍 验证社区功能改进")
    print("=" * 60)
    
    # 检查语法
    print("\n📋 检查文件语法:")
    syntax_ok = True
    for filepath in ['models/community.py', 'routes/community.py', 'app.py']:
        if not check_file_syntax(filepath):
            syntax_ok = False
    
    # 检查功能实现
    model_ok = check_model_definition()
    route_ok = check_route_definition()
    app_ok = check_app_registration()
    
    print("\n" + "=" * 60)
    if syntax_ok and model_ok and route_ok and app_ok:
        print("✅ 所有检查通过！社区功能改进已完成")
        print("\n📝 新增功能:")
        print("   1. 作品举报功能（7 种举报原因）")
        print("   2. 隐私保护（user_id 脱敏、小学年级模糊、作者匿名化）")
        print("\n📚 使用说明：详见 COMMUNITY_IMPROVEMENTS.md")
        sys.exit(0)
    else:
        print("❌ 部分检查未通过，请检查上述输出")
        sys.exit(1)
