"use server";

import { revalidatePath } from "next/cache";
import Thought from "../models/thought.model";
import User from "../models/user.model";
import { connectToDB } from "../mongoose";

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

    const createdThought = await Thought.create({
      text,
      author,
      community: null,
    });

    //Update the user model
    await User.findByIdAndUpdate(author, {
      $push: {
        thought: createdThought._id,
      },
    });

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

export async function fetchThoughtById(id: string) {
  connectToDB();

  try {
    // TODO: Populate Community
    const thought = await Thought.findById(id)
      .populate({
        path: "author",
        model: User,
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
