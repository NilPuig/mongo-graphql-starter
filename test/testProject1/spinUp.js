import { MongoClient } from "mongodb";
import { queryAndMatchArray, runMutation, runQuery, nextConnectionString } from "../testUtil";
import { makeExecutableSchema } from "graphql-tools";
import { createGraphqlSchema } from "../../src/module";
import path from "path";
import glob from "glob";
import fs from "fs";

import * as projectSetupA from "./projectSetup";

export async function create() {
  await createGraphqlSchema(projectSetupA, path.resolve("./test/testProject1"));

  if (true || process.env.InCI) {
    glob.sync("./test/testProject1/graphQL/**/resolver.js").forEach(f => {
      let newFile = fs.readFileSync(f, { encoding: "utf8" }).replace(/"mongo-graphql-starter"/, `"../../../../src/module"`);
      fs.writeFileSync(f, newFile);
    });
  }
}

export default async function() {
  await create();

  const [{ default: resolvers }, { default: typeDefs }] = await Promise.all([import("./graphQL/resolver"), import("./graphQL/schema")]);

  let db, schema;
  db = await MongoClient.connect(nextConnectionString());
  schema = makeExecutableSchema({ typeDefs, resolvers, initialValue: { db: {} } });

  return {
    db,
    schema,
    queryAndMatchArray: options => queryAndMatchArray({ schema, db, ...options }),
    runMutation: options => runMutation({ schema, db, ...options })
  };
}
