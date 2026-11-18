import { BlogEditorPage } from "../components/operations/blogs/BlogEditorPage";
import { useParams } from "react-router-dom";

export function OperationsBlogEditorRoute() {
  const { blogId } = useParams();
  return <BlogEditorPage key={blogId ?? "new"} blogId={blogId} />;
}
