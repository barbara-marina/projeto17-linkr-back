import { Router } from "express";

import { checkLiked, createDislike, createLike } from "../controllers/likeController.js";
import { validationToken } from "../middlewares/tokenMiddleware.js";

const likeRouter = Router();

likeRouter.get('/like/:id/:userId', validationToken, checkLiked);
likeRouter.post('/like/:postId/:userId', createLike);
likeRouter.delete('/dislike/:postId/:userId', createDislike);

export default likeRouter;