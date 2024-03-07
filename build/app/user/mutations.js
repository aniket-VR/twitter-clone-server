"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mutations = void 0;
exports.mutations = `#graphql
unFollowUser(to:ID!):Boolean
followUser(to:ID!):Boolean
checkFollowStaus(to:ID!):Boolean
`;
