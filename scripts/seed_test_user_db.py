from __future__ import annotations

import json
import shutil
import sqlite3
import sys
from datetime import datetime, timedelta
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from fab_app.config import AppConfig, BASE_DIR
from fab_app.repositories.task_repository import ensure_task_tables
from fab_app.repositories.user_repository import ensure_user_table


DB_PATH = Path(AppConfig.USER_DATABASE_PATH)
PASSWORD = "123456"


def main() -> None:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    backup_existing_database()
    ensure_user_table()
    ensure_task_tables()
    seed_database()


def backup_existing_database() -> None:
    if not DB_PATH.exists():
        print("backup=none, user.db did not exist")
        return

    backup_path = DB_PATH.with_name(
        f"user.backup-before-test-seed-{datetime.now().strftime('%Y%m%d-%H%M%S')}.db"
    )
    shutil.copy2(DB_PATH, backup_path)
    print(f"backup={backup_path}")


def seed_database() -> None:
    now = datetime.now().replace(second=0, microsecond=0)
    attachment_root = BASE_DIR / "storage" / "uploads" / "test-seed"
    if attachment_root.exists():
        shutil.rmtree(attachment_root)
    attachment_root.mkdir(parents=True, exist_ok=True)

    def dt(days: int = 0, minutes: int = 0) -> str:
        return (now + timedelta(days=days, minutes=minutes)).isoformat(timespec="minutes")

    def day_at(days: int, hour: int, minute: int = 0) -> str:
        return (
            now + timedelta(days=days)
        ).replace(hour=hour, minute=minute, second=0, microsecond=0).isoformat(timespec="minutes")

    def mention(*users: str) -> str:
        return json.dumps(list(users), ensure_ascii=False)

    def write_text_file(name: str, text: str) -> Path:
        path = attachment_root / name
        path.write_text(text, encoding="utf-8")
        return path

    def write_svg_file(name: str, title: str, subtitle: str, accent: str) -> Path:
        path = attachment_root / name
        svg = f"""<svg xmlns="http://www.w3.org/2000/svg" width="720" height="420" viewBox="0 0 720 420">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#082033"/>
      <stop offset="100%" stop-color="#0f766e"/>
    </linearGradient>
  </defs>
  <rect width="720" height="420" rx="30" fill="url(#bg)"/>
  <rect x="46" y="48" width="628" height="324" rx="24" fill="rgba(5, 20, 34, 0.55)" stroke="{accent}" stroke-width="3"/>
  <text x="80" y="135" fill="#e0f2fe" font-size="34" font-family="Microsoft YaHei, Arial" font-weight="700">{title}</text>
  <text x="80" y="195" fill="#bae6fd" font-size="22" font-family="Microsoft YaHei, Arial">{subtitle}</text>
  <text x="80" y="265" fill="{accent}" font-size="20" font-family="Microsoft YaHei, Arial">模拟图片附件，可点击放大预览</text>
  <circle cx="592" cy="134" r="42" fill="{accent}" opacity="0.72"/>
  <path d="M552 298h92M552 328h68" stroke="#67e8f9" stroke-width="10" stroke-linecap="round" opacity="0.72"/>
</svg>
"""
        path.write_text(svg, encoding="utf-8")
        return path

    users = [
        ("admin", PASSWORD, "超级管理员", "系统管理部", "", "admin", "admin@example.test", "13800000000", dt(days=-45), dt()),
        ("B3001", PASSWORD, "赵部长", "制造中心", "", "department_head", "b3001@example.test", "13800003001", dt(days=-44), dt()),
        ("K2001", PASSWORD, "王科长", "AA生产一部", "B3001", "section_chief", "k2001@example.test", "13800002001", dt(days=-43), dt()),
        ("K2002", PASSWORD, "孙科长", "OC生产二部", "B3001", "section_chief", "k2002@example.test", "13800002002", dt(days=-42), dt()),
        ("L1001", PASSWORD, "李线长", "AA生产一部", "K2001", "line_leader", "l1001@example.test", "13800001001", dt(days=-41), dt()),
        ("L1002", PASSWORD, "吴线长", "OC生产二部", "K2002", "line_leader", "l1002@example.test", "13800001002", dt(days=-40), dt()),
        ("U0001", PASSWORD, "蒲永洁", "AA PE", "L1001", "user", "u0001@example.test", "13800004001", dt(days=-39), dt()),
        ("U0002", PASSWORD, "陈接班", "AA PE", "L1001", "user", "u0002@example.test", "13800004002", dt(days=-38), dt()),
        ("U0003", PASSWORD, "周测试", "OC PE", "L1002", "user", "u0003@example.test", "13800004003", dt(days=-37), dt()),
        ("U0004", PASSWORD, "刘维修", "设备维护", "K2001", "user", "u0004@example.test", "13800004004", dt(days=-36), dt()),
        ("U0005", PASSWORD, "何巡检", "AA生产一部", "L1001", "user", "u0005@example.test", "13800004005", dt(days=-35), dt()),
        ("U0006", PASSWORD, "马点检", "AA生产一部", "L1001", "user", "u0006@example.test", "13800004006", dt(days=-34), dt()),
        ("U0007", PASSWORD, "林质检", "OC生产二部", "L1002", "user", "u0007@example.test", "13800004007", dt(days=-33), dt()),
        ("U0008", PASSWORD, "郑设备", "设备维护", "K2002", "user", "u0008@example.test", "13800004008", dt(days=-32), dt()),
        ("U0009", PASSWORD, "黄备件", "备件仓", "K2001", "user", "u0009@example.test", "13800004009", dt(days=-31), dt()),
        ("U0010", PASSWORD, "唐实验", "实验室", "K2002", "user", "u0010@example.test", "13800004010", dt(days=-30), dt()),
        ("U0011", PASSWORD, "郭包装", "包装工程", "L1002", "user", "u0011@example.test", "13800004011", dt(days=-29), dt()),
        ("U0012", PASSWORD, "谢复核", "质量管理", "K2001", "user", "u0012@example.test", "13800004012", dt(days=-28), dt()),
    ]
    shifts = [
        ("早班", "08:00", "16:00", 1, dt(days=-45), dt()),
        ("中班", "16:00", "00:00", 2, dt(days=-45), dt()),
        ("晚班", "00:00", "08:00", 3, dt(days=-45), dt()),
    ]
    floors = [
        ("1F AA线", 1, dt(days=-45), dt()),
        ("2F OC线", 2, dt(days=-45), dt()),
        ("3F Lens线", 3, dt(days=-45), dt()),
        ("4F 包装线", 4, dt(days=-45), dt()),
        ("备件仓", 5, dt(days=-45), dt()),
        ("实验室", 6, dt(days=-45), dt()),
    ]
    departments = [
        ("系统管理部", 1, dt(days=-45), dt()),
        ("制造中心", 2, dt(days=-45), dt()),
        ("AA生产一部", 3, dt(days=-45), dt()),
        ("OC生产二部", 4, dt(days=-45), dt()),
        ("AA PE", 5, dt(days=-45), dt()),
        ("OC PE", 6, dt(days=-45), dt()),
        ("设备维护", 7, dt(days=-45), dt()),
        ("备件仓", 8, dt(days=-45), dt()),
        ("实验室", 9, dt(days=-45), dt()),
        ("包装工程", 10, dt(days=-45), dt()),
        ("质量管理", 11, dt(days=-45), dt()),
    ]

    shift_plan = [
        {"name": "早班", "hour": 8, "handover": "U0001", "receiver": "U0002", "creator": "U0001", "lead": "L1001"},
        {"name": "中班", "hour": 16, "handover": "U0002", "receiver": "U0005", "creator": "U0002", "lead": "L1001"},
        {"name": "晚班", "hour": 0, "handover": "U0005", "receiver": "U0001", "creator": "L1001", "lead": "K2001"},
    ]
    floor_cycle = ["1F AA线", "2F OC线", "3F Lens线", "4F 包装线", "备件仓", "实验室"]
    issue_cycle = [
        ("A-02 首件复测", "首件尺寸复测完成，角度值稳定在规格范围内。", "继续观察 A-02 压合治具，避免批量漂移。", "补传复测截图并在看板中复核趋势。"),
        ("OC-17 换型确认", "换型后连续三批良率恢复，当前无连续异常。", "OC-17 工位需要每 30 分钟记录一次关键尺寸。", "将换型确认单归档并同步质量管理。"),
        ("LBI 边缘值复核", "LBI 抽检发现边缘值接近阈值，已安排复核。", "若连续两批接近阈值，需要通知科长确认。", "对比看板明细，确认是否为单批波动。"),
        ("备件安全库存", "备件仓完成点检，低库存物料已整理清单。", "B 类备件领用需要线长复核。", "补齐 3 个低于安全库存的备件。"),
        ("包装外观巡检", "包装线外观巡检完成，发现轻微擦伤样本 2 件。", "抽检样本请保留到下个班次复核。", "复核擦伤位置并确认是否与搬运相关。"),
        ("实验室复测排程", "实验室复测样品已登记，等待夜班完成光学复测。", "复测报告需要同步 @ 相关负责人。", "整理复测结论并上传图片附件。"),
    ]
    task_templates = [
        ("确认首件复测结果", "根据交接班记录复核首件数据，并补充截图或说明。"),
        ("补齐换型确认单", "检查换型确认单字段是否完整，必要时联系当班人员补充。"),
        ("复核 LBI 边缘值", "拉取看板明细进行交叉核对，确认是否需要升级处理。"),
        ("更新备件安全库存", "对低库存备件执行补库登记，并同步领用记录。"),
        ("完成外观样本复判", "复判外观样本并记录最终判定结果。"),
        ("整理实验室复测报告", "汇总复测结论，@ 对应主管和任务负责人。"),
    ]
    normal_users = ["U0001", "U0002", "U0003", "U0004", "U0005", "U0006", "U0007", "U0008", "U0009", "U0010", "U0011", "U0012"]
    creator_cycle = ["admin", "L1001", "L1002", "K2001", "K2002", "B3001"]

    with sqlite3.connect(str(DB_PATH)) as connection:
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA foreign_keys = OFF")
        clear_tables(connection)

        connection.executemany(
            """
            INSERT INTO USER (
                user, password, display_name, department, supervisor_user, role,
                email, phone, is_active, shift_group_id, created_at, updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, NULL, ?, ?)
            """,
            users,
        )
        connection.executemany(
            """
            INSERT INTO SHIFT_GROUP (
                name, start_time, end_time, sort_order, is_active, created_at, updated_at
            )
            VALUES (?, ?, ?, ?, 1, ?, ?)
            """,
            shifts,
        )
        connection.executemany(
            """
            INSERT INTO FLOOR_SETTING (name, sort_order, created_at, updated_at)
            VALUES (?, ?, ?, ?)
            """,
            floors,
        )
        connection.executemany(
            """
            INSERT INTO DEPARTMENT_SETTING (name, sort_order, created_at, updated_at)
            VALUES (?, ?, ?, ?)
            """,
            departments,
        )
        connection.executemany(
            """
            INSERT INTO SYSTEM_SETTING (key, value, updated_at, updated_by)
            VALUES (?, ?, ?, ?)
            """,
            [
                ("notifications.handover_minutes", json.dumps(45, ensure_ascii=False), dt(), "seed"),
                ("notifications.task_due_hours", json.dumps(48, ensure_ascii=False), dt(), "seed"),
                ("permissions.assign_admin", json.dumps(True, ensure_ascii=False), dt(), "seed"),
            ],
        )

        shift_ids = {
            row["name"]: row["id"]
            for row in connection.execute("SELECT id, name FROM SHIFT_GROUP")
        }
        floor_ids = {
            row["name"]: row["id"]
            for row in connection.execute("SELECT id, name FROM FLOOR_SETTING")
        }
        user_labels = {
            row["user"]: row["display_name"]
            for row in connection.execute("SELECT user, display_name FROM USER")
        }

        handover_ids: list[int] = []
        day_offsets = list(range(-20, 11))
        for day_index, day_offset in enumerate(day_offsets):
            for shift_index, plan in enumerate(shift_plan):
                issue = issue_cycle[(day_index + shift_index) % len(issue_cycle)]
                floor_name = floor_cycle[(day_index + shift_index) % len(floor_cycle)]
                created_at = day_at(day_offset, plan["hour"], 5 + shift_index * 2)
                cursor = connection.execute(
                    """
                    INSERT INTO HANDOVER_RECORD (
                        title, shift_group_id, floor_id, record_time, handover_user, receiver_user,
                        work_summary, precautions, pending_items, keywords, mention_users,
                        created_by, created_at, updated_at
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        "交接班记录",
                        shift_ids[plan["name"]],
                        floor_ids[floor_name],
                        created_at,
                        user_labels[plan["handover"]],
                        user_labels[plan["receiver"]],
                        f"{floor_name} {plan['name']}：{issue[1]} 第 {day_index + 1:02d} 天模拟数据。",
                        issue[2],
                        issue[3],
                        f"{issue[0]} {floor_name} {plan['name']}",
                        mention(plan["lead"], normal_users[(day_index + shift_index) % len(normal_users)]),
                        plan["creator"],
                        created_at,
                        day_at(day_offset, plan["hour"], 18 + shift_index * 3),
                    ),
                )
                handover_ids.append(int(cursor.lastrowid))

        task_ids: list[int] = []
        for task_index in range(96):
            day_offset = -20 + task_index % 31
            template = task_templates[task_index % len(task_templates)]
            assignee = normal_users[task_index % len(normal_users)]
            creator = creator_cycle[task_index % len(creator_cycle)]
            priority = ("低", "中", "高")[task_index % 3]
            start_hour = (8, 10, 13, 16)[task_index % 4]
            start_at = day_at(day_offset, start_hour, (task_index * 7) % 50)
            due_at = day_at(day_offset + (task_index % 4) + 1, min(start_hour + 4, 23), (task_index * 11) % 50)
            completed_at = ""
            reject_reason = ""
            rejected_by = ""
            rejected_at = ""
            if day_offset < -12 and task_index % 7 == 0:
                status = "已驳回"
                reject_reason = "模拟驳回：信息不完整，需要补充附件或复核说明。"
                rejected_by = user_labels[assignee]
                rejected_at = day_at(day_offset, min(start_hour + 2, 23), 30)
            elif day_offset < -4:
                status = "已完成"
                completed_at = day_at(day_offset + 1, min(start_hour + 3, 23), 15)
            elif day_offset <= 0:
                status = "进行中"
            else:
                status = "未开始"
            cursor = connection.execute(
                """
                INSERT INTO TASK_ITEM (
                    title, description, status, priority, start_at, due_at, assignee_user,
                    mention_users, creator_user, handover_record_id, reminder_at, created_at,
                    updated_at, completed_at, reject_reason, rejected_by, rejected_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    f"{template[0]} #{task_index + 1:03d}",
                    f"{template[1]} 关联一个月模拟数据，用于测试筛选、排序、领取、驳回、提醒和 @ 人员。",
                    status,
                    priority,
                    start_at,
                    due_at,
                    user_labels[assignee],
                    mention(normal_users[(task_index + 1) % len(normal_users)], creator_cycle[(task_index + 1) % len(creator_cycle)]),
                    creator,
                    handover_ids[task_index % len(handover_ids)],
                    None,
                    day_at(day_offset, max(start_hour - 1, 0), 5),
                    day_at(day_offset, min(start_hour + 1, 23), 25),
                    completed_at,
                    reject_reason,
                    rejected_by,
                    rejected_at,
                ),
            )
            task_ids.append(int(cursor.lastrowid))

        attachment_rows = []
        for index, handover_id in enumerate(handover_ids):
            if index % 5 == 0:
                filename = f"handover-note-{index + 1:03d}.txt"
                path = write_text_file(filename, f"交接班附件 {index + 1:03d}\n用于测试普通附件下载。\n")
                attachment_rows.append(("handover", handover_id, filename, filename, str(path), "text/plain", "seed", dt(minutes=index)))
            if index % 11 == 0:
                filename = f"handover-image-{index + 1:03d}.svg"
                path = write_svg_file(filename, f"交接班图片 {index + 1:03d}", "历史记录图片预览测试", "#22d3ee")
                attachment_rows.append(("handover", handover_id, filename, filename, str(path), "image/svg+xml", "seed", dt(minutes=index)))

        for index, task_id in enumerate(task_ids):
            if index % 6 == 0:
                filename = f"task-checklist-{index + 1:03d}.txt"
                path = write_text_file(filename, f"任务附件 {index + 1:03d}\n用于测试任务附件下载。\n")
                attachment_rows.append(("task", task_id, filename, filename, str(path), "text/plain", "seed", dt(minutes=index)))
            if index % 10 == 0:
                filename = f"task-image-{index + 1:03d}.svg"
                path = write_svg_file(filename, f"任务图片 {index + 1:03d}", "任务清单图片预览测试", "#2dd4bf")
                attachment_rows.append(("task", task_id, filename, filename, str(path), "image/svg+xml", "seed", dt(minutes=index)))

        connection.executemany(
            """
            INSERT INTO ATTACHMENT (
                owner_type, owner_id, original_name, stored_name, stored_path,
                content_type, uploaded_by, uploaded_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            attachment_rows,
        )
        connection.commit()

        print_summary(connection)

    print(f"db={DB_PATH}")
    print(f"password={PASSWORD}")
    print(f"range={day_offsets[0]} to +{day_offsets[-1]} days, total_days={len(day_offsets)}")


def clear_tables(connection: sqlite3.Connection) -> None:
    for table in [
        "OPERATION_LOG",
        "ATTACHMENT",
        "TASK_ITEM",
        "HANDOVER_RECORD",
        "FLOOR_SETTING",
        "DEPARTMENT_SETTING",
        "SHIFT_GROUP",
        "SYSTEM_SETTING",
        "USER",
    ]:
        connection.execute(f"DELETE FROM {table}")
    connection.execute(
        """
        DELETE FROM sqlite_sequence
        WHERE name IN (
            'SHIFT_GROUP',
            'FLOOR_SETTING',
            'DEPARTMENT_SETTING',
            'HANDOVER_RECORD',
            'TASK_ITEM',
            'ATTACHMENT',
            'OPERATION_LOG'
        )
        """
    )


def print_summary(connection: sqlite3.Connection) -> None:
    for table in [
        "USER",
        "SHIFT_GROUP",
        "FLOOR_SETTING",
        "DEPARTMENT_SETTING",
        "HANDOVER_RECORD",
        "TASK_ITEM",
        "ATTACHMENT",
        "OPERATION_LOG",
        "SYSTEM_SETTING",
    ]:
        count = connection.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]
        print(f"{table}={count}")
    for row in connection.execute(
        """
        SELECT status, COUNT(*) AS total
        FROM TASK_ITEM
        GROUP BY status
        ORDER BY status
        """
    ):
        print(f"TASK_STATUS[{row['status']}]={row['total']}")


if __name__ == "__main__":
    main()
