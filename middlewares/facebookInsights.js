//Importing the fb module
var FB = require('fb');
var _ = require('lodash');
var async = require("async");
var configAuth = require('../config/auth');
var moment = require('moment');
//Importing the request module
var request = require('request');

//Define exports
var exports = module.exports = {};

/**
 Function to get all posts for a given page id
 @params 1.req contains the  user request i.e page id
 */
exports.getPageInsights = function (req, res, next) {
    var accessToken = 'EAAYZAgeykCcUBAMvuRSFhnxZAomhpgNnOj0Pvx5tqkKHLjIYxLrwMKNjTjmgTemwISqnOEbrBZCRCQZCJKpcnLgprZBeRdKNHYphDg07BpV3irmgf3LmLkS1ZAZADAKqzsbva9mfQ5Ltdj0KvqwRMkb6AF6IZAm8VmNXUsLj7EayqAZDZD';

    //Array to hold the list for a given page id
    var finalPostList = [];
    var d = new Date();

    //Store the end date
    var endDate = calculateDate(d);

    //To set start date ,before 6 months
    d.setDate(d.getDate() - 4);

    //Store start date
    var startDate = calculateDate(d);
    console.log('startdate', startDate, endDate)
    //For testing start& end date is hard coded it will be replaced by startDate & endDate
    var query = configAuth.apiVersions.FBInsightsUpdated + '/' + req.query.pageId + '?fields=posts.until(' + endDate + ').since(' + startDate + ')&access_token=' + accessToken;
    return callGetPostApi(query);

    //to get the list of posts for a given page id
    function callGetPostApi(query) {
        /* make the API call */
        FB.api(
            query,
            function (postList) {
                /*  //To handle timeout error
                 if(postList.error.code === 'ETIMEDOUT'){
                 req.app.result = {message:'Timed out error',status:408};
                 next();
                 }*/


                //First time data array will come inside posts object
                if (postList.posts != undefined) {

                    //To get the query from next param
                    var query = postList.posts.paging.next.substr(postList.posts.paging.next.indexOf('v'));
                    for (var key in postList.posts.data)
                        finalPostList.push(postList.posts.data[key].id);
                    return callGetPostApi(query);
                }
                else if (postList.posts == undefined && postList.data.length) {

                    //To get the query from next param
                    var query = postList.paging.next.substr(postList.paging.next.indexOf('v'));
                    for (var key in postList.data)
                        finalPostList.push(postList.data[key].id);
                    return callGetPostApi(query);
                }
                else
                    getPostData(finalPostList);
            }
        );
    }

    //To form the comment query for each post
    function getPostData(postList) {

        //Store the postlist length
        var length = postList.length;

        //Store all comment's details
        var finalCommentList = [];
        var totalComment = [];

        //Store all like's details
        var finalLikeList = [];
        var likesRes = 0;
        var commentsRes = 0;
        var typeComment = 0;
        var typeLike = 1;

        //To store all comment's& like's details
        var commentLikedUserList = [];

        //Final user list
        var finalUserList = [];
        for (var i = 0; i < length; i++) {
            var error = false; //not used now

            //access token is hard coded for testing
            var commentQuery = configAuth.apiVersions.FBInsightsUpdated + '/' + postList[i] + '/comments?access_token=EAAYZAgeykCcUBAMvuRSFhnxZAomhpgNnOj0Pvx5tqkKHLjIYxLrwMKNjTjmgTemwISqnOEbrBZCRCQZCJKpcnLgprZBeRdKNHYphDg07BpV3irmgf3LmLkS1ZAZADAKqzsbva9mfQ5Ltdj0KvqwRMkb6AF6IZAm8VmNXUsLj7EayqAZDZD';
            var likeQuery = configAuth.apiVersions.FBInsightsUpdated + '/' + postList[i] + '/likes?access_token=EAAYZAgeykCcUBAMvuRSFhnxZAomhpgNnOj0Pvx5tqkKHLjIYxLrwMKNjTjmgTemwISqnOEbrBZCRCQZCJKpcnLgprZBeRdKNHYphDg07BpV3irmgf3LmLkS1ZAZADAKqzsbva9mfQ5Ltdj0KvqwRMkb6AF6IZAm8VmNXUsLj7EayqAZDZD';

            //to call getCommentData to get comments details
            getCommentData(commentQuery, postList[i], finalCommentList, totalComment, function (err, commentsData) {
                commentsRes++;
                if (commentsRes == length) {
                    for (var key in commentsData)
                        commentLikedUserList.push(commentsData[key]);
                    return callToGetTopFans(commentLikedUserList, finalUserList, typeComment, next);
                }
            });

            //to call getLikeData to get likes details
            getLikeData(likeQuery, finalLikeList, function (err, response) {
                likesRes++;
                if (likesRes == length) {
                    for (var key in response)
                        commentLikedUserList.push(response[key]);
                    return callToGetTopFans(commentLikedUserList, finalUserList, typeLike, next);
                }
            });
        }
    }

    //To get the like details
    function getLikeData(commentQuery, finalLikeList, callback) {

        // make the API call
        FB.api(
            commentQuery,
            function (likeDetails) {

                /*  //To handle timeout error
                 if(likeDetails.error.code === 'ETIMEDOUT'){
                 req.app.result = {message:'Timed out error',status:408};
                 next();
                 }*/
                //To check the next in data array
                if (likeDetails.data.length && likeDetails.paging.next) {

                    //To get the query from next param
                    var query = likeDetails.paging.next.substr(likeDetails.paging.next.indexOf('v'));
                    for (var key in likeDetails.data)
                        finalLikeList.push(likeDetails.data[key]);
                    return getLikeData(query, finalLikeList, callback);
                }
                else if (likeDetails.data.length && likeDetails.paging.next == undefined) {
                    for (var key in likeDetails.data)
                        finalLikeList.push(likeDetails.data[key]);
                }
                else {
                    for (var key in likeDetails.data)
                        finalLikeList.push(likeDetails.data[key]);
                }
                callback(null, finalLikeList);
            }
        );
    }


    //To get the comment details
    function getCommentData(commentQuery, postList, finalCommentList, totalComment, callback) {

        // make the API call
        FB.api(
            commentQuery,
            function (commentList) {

                /* //To handle timeout error
                 if(commentList.error.code === 'ETIMEDOUT'){
                 req.app.result = {message:'Timed out error',status:408};
                 next();
                 }*/

                //console.log('commentList',finalCommentList)
                //To check the next in data array
                if (commentList.data.length && commentList.paging.next) {

                    //To get the query from next param
                    var query = commentList.paging.next.substr(commentList.paging.next.indexOf('v'));
                    for (var key in commentList.data)
                        finalCommentList.push({
                            id: commentList.data[key].id,
                            name: commentList.data[key].from.name,
                            postId: postList
                        });
                    return getCommentData(query, postList, finalCommentList, totalComment, callback);
                }
                else if (commentList.data.length && commentList.paging.next == undefined) {
                    for (var key in commentList.data)
                        finalCommentList.push({
                            id: commentList.data[key].id,
                            name: commentList.data[key].from.name,
                            postId: postList
                        });
                }
                else {
                    for (var key in commentList.data) {
                        finalCommentList.push({
                            id: commentList.data[key].id,
                            name: commentList.data[key].from.name,
                            postId: postList
                        });
                    }
                }
                var groupedComments = _.groupBy(finalCommentList, 'postId');
                for (var key in groupedComments) {
                    if (key === postList)
                        totalComment.push({postId: postList, comments: groupedComments[postList].length})
                    else  totalComment.push({postId: postList, comments: 0})
                }

                callback(null, finalCommentList);
            }
        );
    }

    //Combine the results from comment's & like's details
    function callToGetTopFans(commentLikedUserList, finalUserList, type, next) {
        for (var key in commentLikedUserList)
            finalUserList.push(commentLikedUserList[key]);
        if (type == 1) {
//            console.log('finalUserList',finalUserList);
            getTopFans(finalUserList, next);
        }

    }

    //To get the top ten users
    function getTopFans(sampleset) {

        //To hold the names of the top ten fans ,here names will be duplicated
        var repeatedNames = [];

        //Array to hold list of fan's ids
        var fansList = [];

        //Object to hold the number of occurrences of each user
        var result = {};

        //Array to hold sorted fans list
        var sortable = [];

        //Object to hold the unique name
        var temp = {};

        //Array to store the final result
        var storeFinalResult = [];

        //To find the number of occurrences of an id
        for (var i = 0; i < sampleset.length; ++i) {
            if (!result[sampleset[i].id])
                result[sampleset[i].id] = 0;
            ++result[sampleset[i].id];
        }

        for (var element in result)
            sortable.push([element, result[element]]);

        //To sort the values in sortable array
        sortable.sort(function (a, b) {
            return b[1] - a[1]
        });

        //Push the top 10 fans id list
        for (var i = 0; i < 10; i++) {
            fansList.push(sortable[i][0]);
        }

        //Find the names for matched ids
        for (var j = 0; j < fansList.length; j++) {
            for (var i = 0; i < sampleset.length; i++) {
                if (sampleset[i].id == fansList[j]) {
                    repeatedNames.push(sampleset[i].name);
                }
            }
        }

        //To remove duplicates
        for (var i = 0; i < repeatedNames.length; i++)
            temp[repeatedNames[i]] = true;

        //To store the final result
        for (var k in temp)
            storeFinalResult.push(k);

        req.app.result = storeFinalResult;
        next();
    }

    //To format the date
    function calculateDate(d) {
        month = '' + (d.getMonth() + 1),
            day = '' + d.getDate(),
            year = d.getFullYear();
        if (month.length < 2) month = '0' + month;
        if (day.length < 2) day = '0' + day;
        var startDate = [year, month, day].join('-');
        return startDate;
    }
}

exports.getInsights = function (req, res, next) {
    var pageName = req.query.name;
    var accessToken = 'EAACEdEose0cBACM4xruqpSE494fPSoHLXNCBkccTK4AtpuTeN48Aqmb0ZAqZBdBxpVwjwsZCf1K8D4UOX1QvnLgZBQ7Jm2KbPH1ioNeOMkbH1MWhZBBOZBdbMnY5HZCxyE8S1ZAebZAE7zFBUwTiUv7W3uCEkf1D7GetVPA1eV7ZB3EQZDZD';
    var query = configAuth.apiVersions.FBInsightsUpdated + '/' + pageName + '?access_token=' + accessToken;
    FB.api(
        query,
        function (response) {
            var pageId = response.id;
            //Array to hold the list for a given page id
            var finalPostList = [];
            var d = new Date();

            //Store the end date
            var endDate = moment(d).format('YYYY-MM-DD');

            //To set start date ,before 2weeks
            d.setDate(d.getDate() - 14);

            //Store start date
            var startDate = moment(d).format('YYYY-MM-DD');
            console.log('startdate', startDate, endDate)
            var query = configAuth.apiVersions.FBInsightsUpdated + '/' + pageId + '?fields=posts.until(' + endDate + ').since(' + startDate + ')&access_token=' + accessToken;
            async.auto({
                get_all_posts: callGetPostApi,
                get_all_comments: ['get_all_posts', getCommentData],
                get_all_likes: ['get_all_comments', 'get_all_posts', getLikeData],
                get_shares: ['get_all_posts', 'get_all_likes', getShares],
                combine_all_impressions: ['get_all_likes', 'get_shares', 'get_all_comments', combineAllImpressions],
                get_all_reactions: ['get_all_likes', 'get_shares', 'get_all_comments', 'combine_all_impressions', getAllReactions]
            }, function (err, results) {
                if (err)
                    return res.status(500).json({error: 'Internal server error', id: req.params.widgetId})
                var finalObject = {},
                    finalObject = {impressions: results.combine_all_impressions, reactions: results.get_all_reactions}
                req.app.result = finalObject
                next();
            })

            //to get the list of posts for a given page id
            function callGetPostApi(callback) {
                getPostList(query);
                function getPostList(query) {
                    /* make the API call */
                    FB.api(
                        query,
                        function (postList) {
                            if(postList.error) return res.status(500).json({error: 'Internal server error'})
                            //First time data array will come inside posts object
                            if (postList.posts != undefined) {

                                //To get the query from next param
                                var query = postList.posts.paging.next.substr(postList.posts.paging.next.indexOf('v'));
                                for (var key in postList.posts.data) {
                                    finalPostList.push({
                                        postId: postList.posts.data[key].id,
                                        postName: postList.posts.data[key].message
                                    });
                                }

                                return getPostList(query);
                            }
                            else if (postList.posts == undefined && postList.data.length) {

                                //To get the query from next param
                                var query = postList.paging.next.substr(postList.paging.next.indexOf('v'));
                                for (var key in postList.data)
                                    finalPostList.push({
                                        postId: postList.data[key].id,
                                        postName: postList.data[key].message
                                    });
                                return getPostList(query);
                            }
                            else
                                callback(null, finalPostList);
                        }
                    );
                }
            }

            //To get the comment details
            function getCommentData(results, callback) {
                console.log('getCommentData')
                var finalCommentList = [];
                async.concatSeries(results.get_all_posts, getTotalCommentsForEachPost, callback);
                function getTotalCommentsForEachPost(postDetail, callback) {
                    var query = configAuth.apiVersions.FBInsightsUpdated + '/' + postDetail.postId + '/comments?limit=3000&access_token=' + accessToken;
                    getAllCommentsWithPagination(query);
                    function getAllCommentsWithPagination(commentQuery) {
                        // make the API call
                        FB.api(
                            commentQuery,
                            function (commentList) {
                                if(commentList.error) return res.status(500).json({error: 'Internal server error'})
                                //To check the next in data array
                                if (commentList.data.length && commentList.paging.next) {

                                    //To get the query from next param
                                    var query = commentList.paging.next.substr(commentList.paging.next.indexOf('v'));
                                    for (var key in commentList.data)
                                        finalCommentList.push({
                                            id: commentList.data[key].id,
                                            name: commentList.data[key].from.name,
                                            postId: postDetail.postId,
                                            postName: postDetail.postName
                                        });
                                    return getAllCommentsWithPagination(query);
                                }
                                else if (commentList.data.length && commentList.paging.next == undefined) {
                                    for (var key in commentList.data)
                                        finalCommentList.push({
                                            id: commentList.data[key].id,
                                            name: commentList.data[key].from.name,
                                            postId: postDetail.postId,
                                            postName: postDetail.postName
                                        });
                                }
                                else {
                                    for (var key in commentList.data) {
                                        finalCommentList.push({
                                            id: commentList.data[key].id,
                                            name: commentList.data[key].from.name,
                                            postId: postDetail.postId,
                                            postName: postDetail.postName
                                        });
                                    }
                                }
                                callback(null, finalCommentList);
                            }
                        );
                    }
                }
            }

            //To get the like details
            function getLikeData(results, callback) {
                console.log('getLikeData')
                var finalLikeList = [];
                async.concatSeries(results.get_all_posts, getTotalLikesForEachPost, callback);
                function getTotalLikesForEachPost(postDetail, callback) {
                    var likeQuery = configAuth.apiVersions.FBInsightsUpdated + '/' + postDetail.postId + '/likes?limit=3000&access_token=' + accessToken;
                    getAllLikesWithPagination(likeQuery);
                    function getAllLikesWithPagination(query) {

                        // make the API call
                        FB.api(
                            query,
                            function (likeDetails) {
                                if(likeDetails.error) return res.status(500).json({error: 'Internal server error'})
                                //To check the next in data array
                                if (likeDetails.data.length && likeDetails.paging.next) {

                                    //To get the query from next param
                                    var query = likeDetails.paging.next.substr(likeDetails.paging.next.indexOf('v'));
                                    for (var key in likeDetails.data)
                                        finalLikeList.push({
                                            id: likeDetails.data[key].id,
                                            name: likeDetails.data[key].id,
                                            postId: postDetail.postId,
                                            postName: postDetail.postName
                                        });
                                    return getAllLikesWithPagination(query);
                                }
                                else if (likeDetails.data.length && likeDetails.paging.next == undefined) {
                                    for (var key in likeDetails.data)
                                        finalLikeList.push({
                                            id: likeDetails.data[key].id,
                                            name: likeDetails.data[key].id,
                                            postId: postDetail.postId,
                                            postName: postDetail.postName
                                        });
                                }
                                else {
                                    for (var key in likeDetails.data)
                                        finalLikeList.push({
                                            id: likeDetails.data[key].id,
                                            name: likeDetails.data[key].id,
                                            postId: postDetail.postId,
                                            postName: postDetail.postName
                                        });
                                }
                                callback(null, finalLikeList);
                            }
                        );
                    }
                }
            }

            function getShares(results, callback) {
                console.log('getShares')
                async.concatSeries(results.get_all_posts, getTotalSharesEachPost, callback);
                function getTotalSharesEachPost(postDetail, callback) {
                    var shareList = [];
                    var shareQuery = configAuth.apiVersions.FBInsightsUpdated + '/' + postDetail.postId + '?fields=shares&access_token=' + accessToken;
                    FB.api(
                        shareQuery,
                        function (shareDetails) {
                            if(shareDetails.error) return res.status(500).json({error: 'Internal server error'})
                            if (!shareDetails.shares) {
                                shareList.push({
                                    shares: 0,
                                    postId: postDetail.postId,
                                    postName: postDetail.postName
                                })
                            }
                            else {
                                shareList.push({
                                    shares: shareDetails.shares.count,
                                    postId: postDetail.postId,
                                    postName: postDetail.postName
                                })
                            }
                            callback(null, shareList);
                        })
                }
            }

            //To get reactions for each post
            function combineAllImpressions(results, callback) {
                var totalComments = [];
                var totalLikes = [];
                var postLength = results.get_all_posts.length;
                var groupedComments = _.groupBy(results.get_all_comments, 'postId');
                var groupedLikes = _.groupBy(results.get_all_likes, 'postId');
                for (var i = 0; i < postLength; i++) {
                    for (var key in groupedComments) {
                        if (key === results.get_all_posts[i].postId) {
                            totalComments.push({
                                comments: groupedComments[key].length,
                                postId: results.get_all_posts[i].postId,
                                postName: results.get_all_posts[i].postName,

                            })
                        }
                    }
                }
                for (var i = 0; i < postLength; i++) {
                    for (var key in groupedLikes) {
                        if (key === results.get_all_posts[i].postId) {
                            totalLikes.push({
                                likes: groupedLikes[key].length,
                                postId: results.get_all_posts[i].postId,
                                postName: results.get_all_posts[i].postName
                            })
                        }
                    }
                }
                for (var j = 0; j < postLength; j++) {
                    var findCommentIndex = _.findIndex(totalComments, function (o) {
                        return o.postId == results.get_all_posts[j].postId;
                    });
                    if (findCommentIndex === -1) {
                        totalComments.push({
                            comments: 0,
                            postId: results.get_all_posts[j].postId,
                            postName: results.get_all_posts[j].postName
                        })
                    }
                    var findLikeIndex = _.findIndex(totalLikes, function (o) {
                        return o.postId == results.get_all_posts[j].postId;
                    });
                    if (findLikeIndex === -1) {
                        totalLikes.push({
                            likes: 0,
                            postId: results.get_all_posts[j].postId,
                            postName: results.get_all_posts[j].postName
                        })
                    }
                }
                var finalCount = totalComments.concat(totalLikes);
                var finalImpressionObject = finalCount.concat(results.get_shares);
                var groupedComments = _.groupBy(finalImpressionObject, 'postId');
                var finalValue;
                var finalImpressionArray = [];
                for (var key = 0; key < results.get_all_posts.length; key++) {
                    finalValue = groupedComments[results.get_all_posts[key].postId][0]
                    for (var i = 1; i < groupedComments[results.get_all_posts[key].postId].length; i++) {
                        finalValue = _.merge(finalValue, groupedComments[results.get_all_posts[key].postId][i]);
                    }
                    finalImpressionArray.push(finalValue)
                }
                var impressions = [];
                for (var i = 0; i < finalImpressionArray.length; i++) {
                    impressions.push({
                        postId: finalImpressionArray[i].postId,
                        postName: finalImpressionArray[i].postName,
                        count: {
                            comments: finalImpressionArray[i].comments,
                            likes: finalImpressionArray[i].likes,
                            shares: finalImpressionArray[i].shares
                        }
                    })
                }
                callback(null, impressions)
            }

            function getAllReactions(results, callback) {
                console.log('getAllReactions', results.get_all_posts.length)
                var finalReactionList = [];
                var totalReactions = [];
                async.concatSeries(results.get_all_posts, getEachPostReactions, function (err, responseCb) {
                    callback(null, _.uniqBy(responseCb, 'postId'))
                })
                function getEachPostReactions(postDetail, callback) {
                    var reactionsQuery = configAuth.apiVersions.FBInsightsUpdated + '/' + postDetail.postId + '?fields=reactions.limit(3000)&access_token=' + accessToken;
                    getAllReactionsWithPagination(reactionsQuery);
                    function getAllReactionsWithPagination(query) {
                        FB.api(
                            query,
                            function (reactionDetails) {
                                if(reactionDetails.error) return res.status(500).json({error: 'Internal server error'})
                                if (reactionDetails.reactions != undefined && reactionDetails.reactions.paging.next != undefined) {

                                    for (var key in reactionDetails.reactions.data) {
                                        finalReactionList.push({
                                            postId: postDetail.postId,
                                            postName: postDetail.postName,
                                            id: reactionDetails.reactions.data[key].id,
                                            name: reactionDetails.reactions.data[key].name,
                                            type: reactionDetails.reactions.data[key].type,
                                        });
                                    }
                                    //if (reactionDetails.reactions.paging.next != undefined) {
                                    //To get the query from next param
                                    var query = reactionDetails.reactions.paging.next.substr(reactionDetails.reactions.paging.next.indexOf('v'));
                                    return getAllReactionsWithPagination(query);
                                    //}

                                }
                                else if (reactionDetails.reactions == undefined && reactionDetails.data.length && reactionDetails.paging.next !== undefined) {

                                    //To get the query from next param
                                    var query = reactionDetails.paging.next.substr(reactionDetails.paging.next.indexOf('v'));
                                    for (var key in reactionDetails.data)
                                        finalReactionList.push({
                                            postId: postDetail.postId,
                                            postName: postDetail.postName,
                                            id: reactionDetails.data[key].id,
                                            name: reactionDetails.data[key].name,
                                            type: reactionDetails.data[key].type
                                        });
                                    return getAllReactionsWithPagination(query);
                                }

                                else {
                                    if (reactionDetails.reactions != undefined) {
                                        for (var key in reactionDetails.reactions.data) {
                                            finalReactionList.push({
                                                postId: postDetail.postId,
                                                postName: postDetail.postName,
                                                id: reactionDetails.reactions.data[key].id,
                                                name: reactionDetails.reactions.data[key].name,
                                                type: reactionDetails.reactions.data[key].type,
                                            });
                                        }
                                    }
                                    else {
                                        for (var key in reactionDetails.data) {
                                            finalReactionList.push({
                                                postId: postDetail.postId,
                                                postName: postDetail.postName,
                                                id: reactionDetails.data[key].id,
                                                name: reactionDetails.data[key].name,
                                                type: reactionDetails.data[key].type,
                                            });
                                        }
                                    }
                                    var groupedReactionByPosts = _.groupBy(finalReactionList, 'postId');
                                    var countArray = [];
                                    var groupReactionsByType = _.groupBy(groupedReactionByPosts[postDetail.postId], 'type');
                                    var obj = {};
                                    for (var index in groupReactionsByType) {
                                        var mergedObject;
                                        obj[index] = groupReactionsByType[index].length;
                                        mergedObject = obj;
                                    }
                                    countArray.push(obj);
                                    totalReactions.push({
                                        count: obj,
                                        postId: postDetail.postId,
                                        postName: postDetail.postName
                                    })
                                    for (var i = 0; i < totalReactions.length; i++) {
                                        if (!('LIKE' in totalReactions[i].count )) totalReactions[i].count = _.merge({LIKE: 0}, totalReactions[i].count)
                                        if (!('LOVE' in totalReactions[i].count )) totalReactions[i].count = _.merge({LOVE: 0}, totalReactions[i].count)
                                        if (!('HAHA' in totalReactions[i].count )) totalReactions[i].count = _.merge({HAHA: 0}, totalReactions[i].count)
                                        if (!('WOW' in totalReactions[i].count )) totalReactions[i].count = _.merge({WOW: 0}, totalReactions[i].count)
                                        if (!('SAD' in totalReactions[i].count )) totalReactions[i].count = _.merge({SAD: 0}, totalReactions[i].count)
                                        if (!('ANGRY' in totalReactions[i].count )) totalReactions[i].count = _.merge({ANGRY: 0}, totalReactions[i].count)
                                    }
                                    var uniquePostReaction = _.uniqBy(totalReactions, 'postId');
                                    console.log('totalReactions')
                                    callback(null, uniquePostReaction);
                                }
                            })
                    }

                }
            }
        }
    );
}

