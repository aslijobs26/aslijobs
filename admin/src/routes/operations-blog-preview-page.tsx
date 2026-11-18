import { OperationsLayout } from "../components/operations/layout/OperationsLayout";
import { fetchAdminBlog } from "../services/blogs.service";
import { getOperationsApiErrorMessage } from "../utils/operations-api-errors";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

export function OperationsBlogPreviewPage() {
  const { blogId = "" } = useParams();
  const [html, setHtml] = useState("");
  const [title, setTitle] = useState("");
  const [faqs, setFaqs] = useState<{ question: string; answer: string }[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetchAdminBlog(blogId)
      .then((blog) => {
        setTitle(blog.title);
        setHtml(blog.content);
        setFaqs(blog.faqs ?? []);
      })
      .catch((err) => setError(getOperationsApiErrorMessage(err, "Preview unavailable.")));
  }, [blogId]);

  return (
    <OperationsLayout title="Preview">
      <article className="mx-auto max-w-3xl p-4 sm:p-6">
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <h1 className="text-3xl font-bold">{title}</h1>
        <div className="mt-6 text-sm leading-7" dangerouslySetInnerHTML={{ __html: html }} />
        {faqs.length > 0 ? (
          <section className="mt-12">
            <h2 className="text-[1.65rem] font-bold tracking-tight text-foreground">Frequently Asked Questions</h2>
            <div className="mt-2">
              {faqs.map((item) => (
                <details key={item.question} className="py-4">
                  <summary className="cursor-pointer list-none text-[15px] leading-relaxed text-muted">{item.question}</summary>
                  <p className="mt-2 text-sm leading-relaxed text-foreground/80">{item.answer}</p>
                </details>
              ))}
            </div>
          </section>
        ) : null}
      </article>
    </OperationsLayout>
  );
}
