import type { OperationsOrgTreeNode } from "../../../types/operations-organization";

export function formatOrgUnitType(type: string): string {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

export function flattenOrgTree(
  nodes: OperationsOrgTreeNode[],
): OperationsOrgTreeNode[] {
  const result: OperationsOrgTreeNode[] = [];
  const walk = (list: OperationsOrgTreeNode[]) => {
    for (const node of list) {
      result.push(node);
      if (node.children.length > 0) {
        walk(node.children);
      }
    }
  };
  walk(nodes);
  return result;
}

export function findOrgNode(
  nodes: OperationsOrgTreeNode[],
  unitId: string,
): OperationsOrgTreeNode | null {
  for (const node of nodes) {
    if (node.id === unitId) return node;
    const child = findOrgNode(node.children, unitId);
    if (child) return child;
  }
  return null;
}

export const findOrgNodeById = findOrgNode;

export function collectAncestorIds(
  nodes: OperationsOrgTreeNode[],
  unitId: string,
): string[] {
  const node = findOrgNode(nodes, unitId);
  return node?.ancestorIds ?? [];
}
