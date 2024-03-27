import { fetchProfileThought } from "@/lib/actions/user.actions";
import { redirect } from "next/navigation";
import ThoughtCard from "../cards/ThoughtCard";

interface Props {
  currentUserId: string;
  accountId: string;
  accountType: string;
}

const ThoughtsTab = async ({
  currentUserId,
  accountId,
  accountType,
}: Props) => {
  const profileThought = await fetchProfileThought(accountId);

  if (!profileThought) redirect("/");

  return (
    <section className="mt-9 flex flex-col gap-10">
      {profileThought.thought.map((thought: any) => (
        <ThoughtCard
          key={thought?._id}
          id={thought?._id}
          currentUserId={currentUserId}
          parentId={thought.parentId}
          content={thought.text}
          author={
            accountType === "User"
              ? {
                  name: profileThought.name,
                  image: profileThought.image,
                  id: profileThought.id,
                }
              : {
                  name: thought.author.name,
                  image: thought.author.image,
                  id: thought.author.id,
                }
          }
          community={thought.community}
          createdAt={thought.createdAt}
          comments={thought.children}
        />
      ))}
    </section>
  );
};

export default ThoughtsTab;
