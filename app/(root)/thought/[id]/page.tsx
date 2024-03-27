import ThoughtCard from "@/components/cards/ThoughtCard";
import Comment from "@/components/forms/Comment";
import { fetchThoughtById } from "@/lib/actions/thought.actions";
import { fetchUser } from "@/lib/actions/user.actions";
import { currentUser } from "@clerk/nextjs";
import { redirect } from "next/navigation";

const page = async ({ params }: { params: { id: string } }) => {
  if (!params.id) return null;

  const user = await currentUser();
  if (!user) return null;

  const userinfo = await fetchUser(user.id);

  if (!userinfo?.onboarded) return redirect("/onboarding");

  const thought = await fetchThoughtById(params.id);

  return (
    <section className="relative">
      <div className="">
        <ThoughtCard
          key={thought?._id}
          id={thought?._id}
          currentUserId={user?.id || ""}
          parentId={thought.parentId}
          content={thought.text}
          author={thought.author}
          community={thought.community}
          createdAt={thought.createdAt}
          comments={thought.children}
        />
      </div>

      <div className="mt-7 ">
        <Comment
          thoughtId={JSON.stringify(thought._id)}
          currentUserImage={userinfo.image}
          currentUserId={JSON.stringify(userinfo._id)}
        />
      </div>

      <div className="mt-10 ">
        {thought.children.map((childItem: any) => (
          <ThoughtCard
            key={childItem?._id}
            id={childItem?._id}
            currentUserId={user?.id || ""}
            parentId={childItem.parentId}
            content={childItem.text}
            author={childItem.author}
            community={childItem.community}
            createdAt={childItem.createdAt}
            comments={childItem.children}
            isComment={true}
          />
        ))}
      </div>
    </section>
  );
};

export default page;
