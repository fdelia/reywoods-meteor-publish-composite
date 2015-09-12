Articles = new Mongo.Collection('articles');
Authors = new Mongo.Collection('authors');

// trying to subscribe twice at the same time: I expect it to break 
function badSubscribtion(_this){
    _this.subscribe('article', 'article1');
    _this.subscribe('article', 'article1');

}

Router.route('/', {
    name: 'page1',
    waitOn: function() {
        // badSubscribtion(this);
        return this.subscribe('article', 'article1');
    }
});

Router.route('/page2', {
    name: 'page2',
    waitOn: function() {
        // badSubscribtion(this);
        return this.subscribe('article', 'article2');
    }
});

if (Meteor.isClient) {
    RelatedArticles = new Mongo.Collection('relatedArticles');

    Template.articles.helpers({
        articles: function () {
            return Articles.find();
        },
        relatedArticles: function() {
            var relArticles = RelatedArticles.find().fetch();

            relArticles.forEach(function(art){
                var authors = Authors.find({ hasWritten: art._id }).fetch();
                if (authors[0]) art.authorName = authors[0].name;
            });

            return relArticles;
        }
    });
}

if (Meteor.isServer) {
    Meteor.startup(function () {
        if (Articles.find().count() <= 0) {
            Articles.insert({
                _id: 'article1',
                title: 'Article 1'
            });
            Articles.insert({
                _id: 'article1.1',
                title: 'Article 1.1',
                relatedTo: 'article1'
            });
            Articles.insert({
                _id: 'article1.2',
                title: 'Article 1.2',
                relatedTo: 'article1'
            });

            Articles.insert({
                _id: 'article2',
                title: 'Article 2'
            });
            Articles.insert({
                _id: 'article2.1',
                title: 'Article 2.1',
                relatedTo: 'article2'
            });
            Articles.insert({
                _id: 'article2.2',
                title: 'Article 2.2',
                relatedTo: 'article2'
            });

            // spam the db a bit
            console.log('filling up DB');
            for (var i=3; i<1000; i++){
                Articles.insert({
                    _id: 'article1.'+i,
                    title: 'Article1.'+i,
                    relatedTo: 'article1'
                });
                Authors.insert({
                    name: 'author nr. '+i,
                    hasWritten: 'article1.'+i
                });
            }
            console.log('...finished');
        }
    });

    Meteor.publishComposite('article', function(articleId) {
        return {
            find: function() {
                return Articles.find({ _id: articleId });
            },
            children: [
                {
                    collectionName: 'relatedArticles',

                    find: function(article) {
                        return Articles.find({ relatedTo: article._id });
                    },

                    children: [{
                        find: function(relArticle){
                                return Authors.find({ hasWritten: relArticle._id });
                              }
                            }]
                }, {
                    // the author of this one
                }
            ]
        };
    });
}
