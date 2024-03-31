"use server";

import { revalidatePath } from "next/cache";
import User from "../models/user.model";
import { connectToDB } from "../mongoose";
import Thought from "../models/thought.model";
import { FilterQuery, SortOrder } from "mongoose";
import Community from "../models/community.model";

interface Paramtype {
  userId: string;
  username: string;
  name: string;
  bio: string;
  image: string;
  path: string;
}

export async function updateUser({
  userId,
  username,
  name,
  bio,
  image,
  path,
}: Paramtype): Promise<void> {
  connectToDB();

  try {
    await User.findOneAndUpdate(
      { id: userId },
      {
        username: username.toLocaleLowerCase(),
        name,
        bio,
        image,
        onboarded: true,
      },
      { upsert: true }
    );

    if (path === "/profile/edit") {
      revalidatePath(path);
    }
  } catch (error: any) {
    throw new Error(`Failed to update/create user: ${error.message}`);
  }
}

export async function fetchUserPosts(userId: string) {
  try {
    connectToDB();

    // Find all Thoughts authored by the user with the given userId
    const thought = await User.findOne({ id: userId }).populate({
      path: "thought",
      model: Thought,
      populate: [
        {
          path: "community",
          model: Community,
          select: "name id image _id", // Select the "name" and "_id" fields from the "Community" model
        },
        {
          path: "children",
          model: Thought,
          populate: {
            path: "author",
            model: User,
            select: "name image id", // Select the "name" and "_id" fields from the "User" model
          },
        },
      ],
    });
    return thought;
  } catch (error) {
    console.error("Error fetching user Thoughts:", error);
    throw error;
  }
}

export async function fetchUser(userId: string) {
  try {
    connectToDB();

    return await User.findOne({ id: userId }).populate({
      path: "communities",
      model: Community,
    });
  } catch (error: any) {
    throw new Error(`Failed to fetch user: ${error.message}`);
  }
}

export async function fetchProfileThought(userId: string) {
  try {
    connectToDB();
    // TODO: populate community
    const thoughts = await User.findOne({ id: userId })
      .populate({
        path: "thought",
        model: Thought,
        populate: {
          path: "children",
          model: Thought,
          populate: {
            path: "author",
            model: User,
            select: " id name image",
          },
        },
      })
      .exec();

    return thoughts;
  } catch (error: any) {
    throw new Error(`Failed to fetch user thoughts: ${error.message}`);
  }
}

export async function fetchUsers({
  userId,
  searchString = "",
  pageNumber = 1,
  pageSize = 20,
  sortBy = "desc",
}: {
  userId: string;
  searchString?: string;
  pageNumber?: number;
  pageSize?: number;
  sortBy?: SortOrder;
}) {
  try {
    connectToDB();
    const skipAmount = (pageNumber - 1) * pageSize;

    const regex = new RegExp(searchString, "i");

    const query: FilterQuery<typeof User> = {
      id: {
        $ne: userId,
      },
    };

    if (searchString.trim() !== "") {
      query.$or = [
        { username: { $regex: regex } },
        { name: { $regex: searchString } },
      ];
    }

    const sortOptions = { createdAt: sortBy };

    const usersQuery = User.find(query)
      .sort(sortOptions)
      .skip(skipAmount)
      .limit(pageSize);

    const totalUsersCount = await User.countDocuments(query);

    const users = await usersQuery.exec();

    const isNext = totalUsersCount > skipAmount + users.length;

    return { users, isNext };
  } catch (error: any) {
    throw new Error(`Failed to fetch users: ${error.message}`);
  }
}

export async function getActivity(userId: string) {
  try {
    connectToDB();

    // find all thoughts created by the user
    const userThought = await Thought.find({ author: userId });

    // collect all the child thought ids (replies) from the 'children' field
    const childThoughtIds = userThought.reduce((acc, thought) => {
      return acc.concat(thought.children);
    }, []);

    const replies = await Thought.find({
      _id: { $in: childThoughtIds },
      author: { $ne: userId },
    }).populate({
      path: "author",
      model: User,
      select: " _id name image",
    });

    return replies;
  } catch (error: any) {
    throw new Error(`Failed to fetch user activity: ${error.message}`);
  }
}
