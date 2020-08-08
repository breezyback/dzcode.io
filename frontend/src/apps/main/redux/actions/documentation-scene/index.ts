import { MainStoreStateInterface, SidebarTreeItem } from "t9/types/main";
import Axios from "axios";
import { Dispatch } from "react";
import { Document } from "t9/types/fullstack";
import { actionType } from "../../constants";
import { fullstackConfig } from "src/config";
import { hasInCollection } from "src/common/utils";
import { listToTree } from "src/common/utils/list-to-tree";

const dataURL = fullstackConfig.data.url;

export const fetchDocumentationList = () => async (
  dispatch: Dispatch<any>,
  getState: MainStoreStateInterface,
) => {
  try {
    const response = await Axios.get(dataURL + "/documentation/list.c.json");
    const documentationList = response.data;
    // convert list into tree
    const { tree, ids } = listToTree<Document, SidebarTreeItem>(
      documentationList,
      (item) => item.slug,
      (item) => item.slug.substring(0, item.slug.lastIndexOf("/")),
      "children",
      (item) => {
        return {
          content: item.title,
          id: item.slug,
          link: "/Learn/" + item.slug,
        };
      },
    );

    dispatch({
      type: actionType.UPDATE_LEARN_SCENE,
      payload: { sidebarTree: tree, expanded: ids },
    });
  } catch (error) {
    console.error(error);
  }
};

export const fetchCurrentDocument = () => async (
  dispatch: Dispatch<any>,
  getState: MainStoreStateInterface,
) => {
  const documentSlug = location.pathname
    .substring(location.pathname.indexOf("/", 1) + 1)
    .replace("/", "");
  const cashedDocument = hasInCollection<Document>(
    getState().documentation,
    "slug",
    documentSlug,
    [["content"]],
  );
  if (cashedDocument) {
    // update our scene state
    dispatch({
      type: actionType.UPDATE_LEARN_SCENE,
      payload: { currentDocument: cashedDocument },
    });
  } else {
    // BUG: cashing not working in local (slug related issue)
    dispatch({
      type: actionType.UPDATE_LEARN_SCENE,
      payload: { currentDocument: null },
    });
    try {
      const response = await Axios.get(
        dataURL + `/documentation/${documentSlug}.json`,
      );
      const currentDocument = response.data;
      // update our scene state
      dispatch({
        type: actionType.UPDATE_LEARN_SCENE,
        payload: { currentDocument },
      });
      // update our cache state
      dispatch({
        type: actionType.UPDATE_DOCUMENTATION,
        payload: [currentDocument],
      });
    } catch (error) {
      console.error(error);
    }
  }
};
