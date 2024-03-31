"use server";

import { revalidatePath } from "next/cache";
import Thought from "../models/thought.model";
import User from "../models/user.model";
import { connectToDB } from "../mongoose";
import Community from "../models/community.model";

interface Paramtype {
  text: string;
  author: string;
  communityId: string | null;
  path: string;
}

export async function createThought({
  text,
  author,
  communityId,
  path,
}: Paramtype): Promise<void> {
  try {
    connectToDB();

    const communityIdObject = await Community.findOne(
      { id: communityId },
      { _id: 1 }
    );

    const createdThought = await Thought.create({
      text,
      author,
      community: communityIdObject,
    });

    //Update the user model
    await User.findByIdAndUpdate(author, {
      $push: {
        thought: createdThought._id,
      },
    });

    if (communityIdObject) {
      // Update Community model
      await Community.findByIdAndUpdate(communityIdObject, {
        $push: { thought: createdThought._id },
      });
    }

    revalidatePath(path);
  } catch (error: any) {
    throw new Error(`Failed To Create Thougt: ${error.message}`);
  }
}

export async function fetchPosts(pageNumber = 1, pageSize = 20) {
  try {
    connectToDB();

    // Calculate the number of posts to skip
    const skipAmount = (pageNumber - 1) * pageSize;

    // Fetch the posts that have no parents (top-lavel thought)
    const postQuery = Thought.find({
      parentId: { $in: [null, undefined] },
    })
      .sort({ createdAt: "desc" })
      .skip(skipAmount)
      .limit(pageSize)
      .populate({ path: "author", model: User })
      .populate({ path: "community", model: Community })
      .populate({
        path: "children",
        populate: {
          path: "author",
          model: User,
          select: "_id name parentId image",
        },
      });

    const totalPostCount = await Thought.countDocuments({
      parentId: { $in: [null, undefined] },
    });

    const posts = await postQuery.exec();

    const isNext = totalPostCount > skipAmount + posts.length;

    return { posts, isNext };
  } catch (error: any) {
    throw new Error(`Failed to fetch all posts: ${error.message}`);
  }
}

async function fetchAllChildThought(thoughtId: string): Promise<any[]> {
  const childThoughts = await Thought.find({ parentId: thoughtId });

  const descendantThoughts = [];
  for (const childThought of childThoughts) {
    const descendants = await fetchAllChildThought(childThought._id);
    descendantThoughts.push(childThought, ...descendants);
  }

  return descendantThoughts;
}

export async function deleteThought(id: string, path: string): Promise<void> {
  try {
    connectToDB();

    // Find the Thought to be deleted (the main Thought)
    const mainThought = await Thought.findById(id).populate("author community");

    if (!mainThought) {
      throw new Error("Thought not found");
    }

    // Fetch all child Thoughts and their descendants recursively
    const descendantThoughts = await fetchAllChildThought(id);

    // Get all descendant Thought IDs including the main Thought ID and child Thought IDs
    const descendantThoughtIds = [
      id,
      ...descendantThoughts.map((thought) => thought._id),
    ];

    // Extract the authorIds and communityIds to update User and Community models respectively
    const uniqueAuthorIds = new Set(
      [
        ...descendantThoughts.map((Thought) => Thought.author?._id?.toString()), // Use optional chaining to handle possible undefined values
        mainThought.author?._id?.toString(),
      ].filter((id) => id !== undefined)
    );

    const uniqueCommunityIds = new Set(
      [
        ...descendantThoughts.map((Thought) =>
          Thought.community?._id?.toString()
        ), // Use optional chaining to handle possible undefined values
        mainThought.community?._id?.toString(),
      ].filter((id) => id !== undefined)
    );

    // Recursively delete child Thoughts and their descendants
    await Thought.deleteMany({ _id: { $in: descendantThoughtIds } });

    // Update User model
    await User.updateMany(
      { _id: { $in: Array.from(uniqueAuthorIds) } },
      { $pull: { Thoughts: { $in: descendantThoughtIds } } }
    );

    // Update Community model
    await Community.updateMany(
      { _id: { $in: Array.from(uniqueCommunityIds) } },
      { $pull: { Thoughts: { $in: descendantThoughtIds } } }
    );

    revalidatePath(path);
  } catch (error: any) {
    throw new Error(`Failed to delete Thought: ${error.message}`);
  }
}

export async function fetchThoughtById(id: string) {
  connectToDB();

  try {
    const thought = await Thought.findById(id)
      .populate({
        path: "author",
        model: User,
        select: "_id id name image",
      })
      .populate({
        path: "community",
        model: Community,
        select: "_id id name image",
      })
      .populate({
        path: "children",
        populate: [
          {
            path: "author",
            model: User,
            select: "_id id name parentId image",
          },
          {
            path: "children",
            model: Thought,
            populate: {
              path: "author",
              model: User,
              select: "_id id name parentId image",
            },
          },
        ],
      })
      .exec();

    return thought;
  } catch (error: any) {
    throw new Error(`Error Fetching Thought By Id: ${error.message}`);
  }
}

export async function addCommentToThought(
  thoughtId: string,
  commentText: string,
  userId: string,
  path: string
): Promise<void> {
  try {
    connectToDB();

    // Adding a Comment
    const originalThought = await Thought.findById(thoughtId);

    if (!originalThought) {
      throw new Error("Thought Not Found.");
    }

    const newCommentThought = new Thought({
      text: commentText,
      author: userId,
      parentId: thoughtId,
    });

    //Save the new comment
    const savedCommentThought = await newCommentThought.save();

    //update the original thought to include the new comment
    originalThought.children.push(savedCommentThought._id);

    // Save the Original Thought
    await originalThought.save();

    revalidatePath(path);
  } catch (error: any) {
    throw new Error(`Failed To Comment On Thougt: ${error.message}`);
  }
}
