var html5pdf = require("html5-to-pdf");
var exports = module.exports = {};

exports.createHtml5ToPdf = function (req, res, next) {
    //console.log("Html : "+req.body.dashboardLayout);
    var html = "<img src='"+req.body.dashboardLayout+"' />";
    var timestamp = Number(new Date());
    var outputPath = "public/PDF/"+req.body.dashboardName+"_"+timestamp+".pdf";

    if(html==undefined || html==null){
        req.app.result = {'status': '302','Response': 'Error in creating PDF'};
        next();
    }
    else{
        html5pdf({paperFormat:'Legal'}).from.string(html).to(outputPath, function () {
            req.app.result = {'status': '200','Response': "/PDF/"+req.body.dashboardName+"_"+timestamp+".pdf"};
            next();
        })
    }
};