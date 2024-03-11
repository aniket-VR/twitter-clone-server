"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolvers = void 0;
const db_1 = require("../../clients/db");
const user_1 = __importDefault(require("../../services/user"));
const redis_1 = __importDefault(require("../../clients/redis"));
const quries = {
    verifyGoogleToken: (parent, { token }) => __awaiter(void 0, void 0, void 0, function* () {
        const verifyedToken = yield user_1.default.verifyUserGoogleToken(token);
        return verifyedToken;
    }),
    getCurrentUser: (parent, args, ctx) => __awaiter(void 0, void 0, void 0, function* () {
        const user = user_1.default.getCurrentUser(ctx);
        return user;
    }),
    getUserFromId: (parent, { id }) => __awaiter(void 0, void 0, void 0, function* () {
        const result = yield redis_1.default.get(`GETUSER_WITH_ID:${id}`);
        if (result)
            return JSON.parse(result);
        const resp = yield db_1.prismaClient.user.findUnique({ where: { id } });
        yield redis_1.default.set(`GETUSER_WITH_ID:${id}`, JSON.stringify(resp));
        return resp;
    }),
    getFollowing: (parent, {}, ctx) => __awaiter(void 0, void 0, void 0, function* () {
        return yield user_1.default.getCurrentUserFollowing(ctx);
    }),
};
const mutations = {
    unFollowUser: (parent, { to }, ctx) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b;
        if (!((_a = ctx === null || ctx === void 0 ? void 0 : ctx.user) === null || _a === void 0 ? void 0 : _a.id))
            throw new Error("unauthenticated");
        yield redis_1.default.del(`CURRENT_USER_FOLLOWING:${ctx.user.id}`);
        yield redis_1.default.del(`USER_RECOMMENDATIONS:${ctx === null || ctx === void 0 ? void 0 : ctx.user.id}`);
        yield redis_1.default.del(`GETUSER_WITH_ID:${to}`);
        yield redis_1.default.del(`CURRENT_USER:${(_b = ctx === null || ctx === void 0 ? void 0 : ctx.user) === null || _b === void 0 ? void 0 : _b.id}`);
        yield user_1.default.unFollow(ctx.user.id, to);
        return true;
    }),
    followUser: (parent, { to }, ctx) => __awaiter(void 0, void 0, void 0, function* () {
        var _c, _d;
        if (!((_c = ctx === null || ctx === void 0 ? void 0 : ctx.user) === null || _c === void 0 ? void 0 : _c.id))
            throw new Error("unauthenticated");
        yield redis_1.default.del(`CURRENT_USER_FOLLOWING:${ctx.user.id}`);
        yield redis_1.default.del(`USER_RECOMMENDATIONS:${ctx === null || ctx === void 0 ? void 0 : ctx.user.id}`);
        yield redis_1.default.del(`GETUSER_WITH_ID:${to}`);
        yield redis_1.default.del(`CURRENT_USER:${(_d = ctx === null || ctx === void 0 ? void 0 : ctx.user) === null || _d === void 0 ? void 0 : _d.id}`);
        const reuslt = yield user_1.default.followUser(ctx.user.id, to);
        return true;
    }),
    checkFollowStaus: (parent, { to }, ctx) => __awaiter(void 0, void 0, void 0, function* () {
        var _e;
        if (!((_e = ctx === null || ctx === void 0 ? void 0 : ctx.user) === null || _e === void 0 ? void 0 : _e.id))
            throw new Error("unauthenticated");
        return yield user_1.default.checkFollow(ctx.user.id, to);
    }),
};
const extraResolver = {
    User: {
        tweets: (parent) => db_1.prismaClient.tweet.findMany({ where: { authorId: parent.id } }),
        followers: (parent) => __awaiter(void 0, void 0, void 0, function* () {
            const result = yield db_1.prismaClient.follows.findMany({
                where: { following: { id: parent.id } },
                include: { follower: true, following: true },
            });
            return result.map((e) => e.follower);
        }),
        following: (parent) => __awaiter(void 0, void 0, void 0, function* () {
            const reuslt = yield db_1.prismaClient.follows.findMany({
                where: { follower: { id: parent.id } },
                include: { follower: true, following: true },
            });
            return reuslt.map((e) => e.following);
        }),
        recommendation: (parent, {}, ctx) => __awaiter(void 0, void 0, void 0, function* () {
            if (!ctx.user)
                throw new Error("unauthenticate");
            return yield user_1.default.recommendationUser(ctx);
        }),
    },
};
exports.resolvers = { quries, extraResolver, mutations };
