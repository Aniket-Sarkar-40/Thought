import ProfileHeader from "@/components/shared/ProfileHeader";
import ThoughtsTab from "@/components/shared/ThoughtsTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { profileTabs } from "@/constants";
import { fetchUser } from "@/lib/actions/user.actions";
import { currentUser } from "@clerk/nextjs";
import Image from "next/image";
import { redirect } from "next/navigation";

const page = async ({ params }: { params: { id: string } }) => {
  if (!params.id) return null;

  const user = await currentUser();
  if (!user) return null;

  const userinfo = await fetchUser(params.id);

  if (!userinfo?.onboarded) return redirect("/onboarding");

  return (
    <section>
      <ProfileHeader
        accountId={userinfo.id}
        authUserId={user?.id}
        name={userinfo.name}
        username={userinfo.username}
        imgUrl={userinfo.image}
        bio={userinfo.bio}
      />

      <div className="mt-9">
        <Tabs defaultValue="thought" className="w-full">
          <TabsList className="tab">
            {profileTabs.map((tab) => {
              return (
                <TabsTrigger key={tab.label} value={tab.value} className="tab">
                  <Image
                    src={tab.icon}
                    alt={tab.label}
                    width={24}
                    height={24}
                    className="object-contain"
                  />
                  <p className="max-sm:hidden">{tab.label}</p>

                  {tab.label === "Thought" && (
                    <p className="ml-1 rounded-sm px-2 bg-light-4 py-1 !text-tiny-medium text-light-2">
                      {userinfo?.thought?.length}
                    </p>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {profileTabs.map((tab) => (
            <TabsContent
              key={`content-${tab.label}`}
              value={tab.value}
              className="w-full text-light-1"
            >
              <ThoughtsTab
                currentUserId={user.id}
                accountId={userinfo.id}
                accountType="User"
              />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  );
};

export default page;
