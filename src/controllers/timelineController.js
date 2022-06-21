import urlMetadata from "url-metadata";

import timelineRepository from "../repositories/timelineRepository.js";

export async function createPublication(req, res){
    const {url, description} = req.body;
    const hashtags = timelineRepository.getHashtagsInDescription(description); 
    const userId = res.locals.user.id;
    const metaDataPost = await urlMetadata(url);
    
    const {url: urlData, description: descriptionData, title, image} = metaDataPost;
    const verifyMetadados = !metaDataPost || !image || !title || !descriptionData || !urlData
    if(verifyMetadados) return res.status(400).send('Esta url não fornece metadados');

    try {
        if(description.length > 0 && hashtags.length > 0){
            await timelineRepository.insertPostUserDescription(userId, url, description, metaDataPost);
            const lastPost = await timelineRepository.getPostByUrl(url, userId);
            
            const [post] = lastPost.rows;
            const verifyPost = post.deleted || !post || lastPost.rowCount !== 1;
            if(verifyPost) return res.sendStatus(401);
            
            const postId = post.id;
            for(const hashtag of hashtags){
                await timelineRepository.insertHashtag(postId, hashtag);
            }
            return res.sendStatus(201);
        }
        if(description.length > 0 && hashtags.length === 0){
            await timelineRepository.insertPostUserDescription(userId, url, description, metaDataPost);
            return res.sendStatus(201);
        }

        await timelineRepository.insertPostUserDescription(userId, url, null, metaDataPost);
        res.sendStatus(201);
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
}

export async function getPublications(req, res){
    try {
        const result = await timelineRepository.getPosts(false);
        const likeUser = await timelineRepository.likesUsersPost();

        res.status(200).send({
            posts: result.rows,
            usersLikes: likeUser.rows
        });
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
}

export async function updatePublication(req, res){
    const {id} = req.params;
    const user = res.locals.user;
    const {description} = req.body;

    try {
        const postFind = await timelineRepository.getPostById(parseInt(id));
        const [post] = postFind.rows;

        const verifyPost = !post || post.deleted || postFind.rowCount !== 1 || post.userId !== user.id || post.id !== Number(id);
        if(verifyPost) return res.sendStatus(401);
        
        const hashtagsAnterior = timelineRepository.getHashtagsInDescription(post.description);
        const hashtagsAtual = timelineRepository.getHashtagsInDescription(description);

        if(hashtagsAnterior.length > 0){
            for(const hashtag of hashtagsAnterior){
                await timelineRepository.deleteHashtagName(Number(id), hashtag);
            }
        }
        if(description.length > 0 && hashtagsAtual.length > 0){
            await timelineRepository.updatePostDescription(parseInt(id), description);
            
            for(const hashtag of hashtagsAtual){
                await timelineRepository.insertHashtag(parseInt(id), hashtag);
            }
            return res.sendStatus(200);
        }
        if(description.length > 0 && hashtagsAtual.length === 0){
            await timelineRepository.updatePostDescription(parseInt(id), description);
            return res.sendStatus(200);
        }

        await timelineRepository.updatePostDescription(parseInt(id), null);
        res.sendStatus(200);
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
}

export async function deletePublication(req, res){
    const {id} = req.params;
    const user = res.locals.user;

    try {
        const post = await timelineRepository.getPostById(parseInt(id));
        const [postId] = post.rows;

        const verifyPost = postId.deleted || !postId || post.rowCount !== 1 || postId.userId !== Number(user.id);
        if(verifyPost) return res.sendStatus(401);

        await timelineRepository.updateDeletePost(parseInt(id), Number(user.id));
        res.sendStatus(200);
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
}

export async function getPostRedirect(req, res){
    const {id} = req.params;

    try {
        const post = await timelineRepository.getPostById(parseInt(id));
        const [postId] = post.rows;

        const verifyPostRedirect = !postId || post.rowCount !== 1 || postId.deleted || !postId.url;
        if(verifyPostRedirect) return res.sendStatus(401);
        
        res.redirect(postId.url);
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
}