import { fetchUser, getActivity } from "@/lib/actions/user.actions";
import { currentUser } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

const Page = async () => {
  const user = await currentUser();
  if (!user) return null;

  const userinfo = await fetchUser(user.id);

  if (!userinfo?.onboarded) return redirect("/onboarding");

  // Get activity
  const activity = await getActivity(userinfo._id);

  return (
    <section className="">
      <h1 className="head-text mb-10">Activities</h1>
      <section className="mt-10 flex flex-col gap-5 ">
        {activity.length > 0 ? (
          <>
            {activity.map((act) => (
              <Link key={act._id} href={`/thought/${act.parentId}`}>
                <article className="activity-card">
                  <Image
                    src={act.author.image}
                    alt="Profile picture"
                    width={28}
                    height={28}
                    className="rounded-full object-cover h-7 w-7"
                  />
                  <p className="!text-medium-regular text-light-1 ">
                    <span className="mr-1 text-primary-500">
                      {act.author.name}
                    </span>{" "}
                    replied to your thought
                  </p>
                </article>
              </Link>
            ))}
          </>
        ) : (
          <p className="!text-base-regular text-light-3">No activity yet.</p>
        )}
      </section>
    </section>
  );
};

export default Page;
