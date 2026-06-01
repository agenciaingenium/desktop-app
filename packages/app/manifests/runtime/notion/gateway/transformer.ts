import { getLabel } from '../helpers';

export type Workspace = {
  id: string,
  name: string,
  domain: string,
  icon: string,
  pages: string[],
};

export type PageInfo = {
  id: string,
  label: string,
};

export const userContentToWorkspaces = (userContent: any): Workspace[] =>
  Object.values(userContent.recordMap.space)
    .map((item: any) =>
      ({ id: item.value.id, name: item.value.name, domain: item.value.domain, icon: item.value.icon, pages: item.value.pages }));

export const publicPageToWorkspace = ({ spaceName, spaceId, spaceDomain, icon }: any): Workspace => ({
  id: spaceId,
  name: spaceName,
  domain: spaceDomain,
  icon,
  pages: [],
});

export const pagesInfos = (value: any): PageInfo[] =>
  value.results.map((p: any) => ({
    id: p.value.id,
    label: getLabel(p.value),
  }));

export const pageInfos = (value: any): PageInfo => pagesInfos(value)[0];

export const genericParser = (value: any): any => value;
