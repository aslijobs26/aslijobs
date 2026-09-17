import type { OperationsOrgUnitType } from "./operations-org-unit.model.js";
import { ORG_UNIT_CHILD_TYPES } from "./operations-organization.constants.js";

export function canAttachOrgChild(
  parentType: OperationsOrgUnitType,
  childType: OperationsOrgUnitType,
): boolean {
  return ORG_UNIT_CHILD_TYPES[parentType].includes(childType);
}

export function wouldCreateOrgCycle(
  unitId: string,
  newParentId: string | null,
  ancestorIdsOfNewParent: string[],
): boolean {
  if (!newParentId) return false;
  if (unitId === newParentId) return true;
  return ancestorIdsOfNewParent.includes(unitId);
}

export type OrgPeopleCountMap = Map<string, number>;

/**
 * Roll people counts up the tree: each node includes its own + descendant counts.
 */
export function rollupPeopleCounts(
  nodes: Array<{ id: string; parentId: string | null; directCount: number }>,
): OrgPeopleCountMap {
  const byParent = new Map<string | null, string[]>();
  const direct = new Map<string, number>();
  for (const node of nodes) {
    direct.set(node.id, node.directCount);
    const list = byParent.get(node.parentId) ?? [];
    list.push(node.id);
    byParent.set(node.parentId, list);
  }

  const memo = new Map<string, number>();
  function total(id: string): number {
    const cached = memo.get(id);
    if (cached != null) return cached;
    const own = direct.get(id) ?? 0;
    const children = byParent.get(id) ?? [];
    const sum = own + children.reduce((acc, childId) => acc + total(childId), 0);
    memo.set(id, sum);
    return sum;
  }

  const result: OrgPeopleCountMap = new Map();
  for (const node of nodes) {
    result.set(node.id, total(node.id));
  }
  return result;
}
