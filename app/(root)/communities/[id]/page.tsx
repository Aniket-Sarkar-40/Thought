import { currentUser } from "@clerk/nextjs";
import Image from "next/image";
import ProfileHeader from "@/components/shared/ProfileHeader";
import ThoughtsTab from "@/components/shared/ThoughtsTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { communityTabs } from "@/constants";
import { fetchCommunityDetails } from "@/lib/actions/community.actions";
import UserCard from "@/components/cards/UserCard";

const page = async ({ params }: { params: { id: string } }) => {
  if (!params.id) return null;

  const user = await currentUser();
  if (!user) return null;

  const communityDetails = await fetchCommunityDetails(params.id);

  return (
    <section>
      <ProfileHeader
        accountId={communityDetails.id}
        authUserId={user?.id}
        name={communityDetails.name}
        username={communityDetails.username}
        imgUrl={communityDetails.image}
        bio={communityDetails.bio}
        type="Community"
      />

      <div className="mt-9">
        <Tabs defaultValue="thought" className="w-full">
          <TabsList className="tab">
            {communityTabs.map((tab) => {
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
                      {communityDetails?.thought?.length}
                    </p>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value={"thought"} className="w-full text-light-1">
            <ThoughtsTab
              currentUserId={user.id}
              accountId={communityDetails.id}
              accountType="Community"
            />
          </TabsContent>

          {/* member */}
          <TabsContent value={"members"} className="w-full text-light-1">
            <section className="mt-9 flex flex-col gap-10 ">
              {communityDetails?.members.map((member: any) => {
                return (
                  <UserCard
                    key={member.id}
                    id={member._id}
                    name={member.name}
                    username={member.username}
                    imgUrl={member.image}
                    personType="User"
                  />
                );
              })}
            </section>
          </TabsContent>

          {/* request */}
          <TabsContent value={"requests"} className="w-full text-light-1">
            <ThoughtsTab
              currentUserId={user.id}
              accountId={communityDetails.id}
              accountType="Community"
            />
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
};

export default page;
