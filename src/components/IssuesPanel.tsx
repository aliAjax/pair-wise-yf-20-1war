// 交互层：冲突时间提示（编辑期实时列出三类闸门问题，可点击定位节点）
import type { Issue } from "../rules/validate";

interface Props {
  issues: Issue[];
  onSelectNode: (id: string) => void;
}

const KIND_NAME: Record<Issue["kind"], string> = {
  bounds: "节点越出段落",
  cooldown: "冷却不足",
  danger: "危险区相交",
};

const KIND_CLASS: Record<Issue["kind"], string> = {
  bounds: "tag-bounds",
  cooldown: "tag-cooldown",
  danger: "tag-danger",
};

export function IssuesPanel({ issues, onSelectNode }: Props) {
  if (issues.length === 0) {
    return (
      <p className="all-clear">
        ✓ 当前版本无冷却不足、危险区相交或越出段落问题，可以应用改版。
      </p>
    );
  }

  return (
    <ul className="issue-list">
      {issues.map((issue, index) => (
        <li key={index}>
          <span className={`issue-tag ${KIND_CLASS[issue.kind]}`}>
            {KIND_NAME[issue.kind]}
          </span>
          <span className="issue-message">{issue.message}</span>
          {issue.nodeIds.map((id) => (
            <button
              key={id}
              className="issue-jump"
              onClick={() => onSelectNode(id)}
            >
              {id}
            </button>
          ))}
        </li>
      ))}
    </ul>
  );
}
