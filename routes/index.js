var express = require('express');
var router = express.Router();
var cmd = require( "node-cmd" );
var { execSync } = require('child_process');

router.get('/monitoring/*', function(req, res, next) {
    var request = require('request');
    var options = {
        'method': 'GET',
        'url': 'http://localhost:32073/' + req.url.substring(12,req.url.length),
    };
    console.log(options);
    request(options, function (error, response, body) {
        if (error) throw new Error(error);

    }).pipe(res);
});

/* GET home page. */
router.get('/kube/*', function(req, res, next) {

    var request = require('request');
    var options = {
        'method': 'GET',
        'url': 'http://127.0.0.1:8001/' + req.url.substring(6,req.url.length),
    };
    console.log(options);
    request(options, function (error, response, body) {
        if (error) throw new Error(error);

    }).pipe(res);
});

/* GET home page. */
router.get('/helm/', function(req, res, next) {
    var request = require('request');
    var options = {
        'method': 'GET',
        'url': 'https://registry.fems.cf/api/v2.0/projects/fems/repositories?page=1&page_size=10',
    };
    console.log(options);
    request(options, function (error, response, body) {
        if (error) throw new Error(error);

    }).pipe(res);
});

/* GET helm ls*/
router.get('/services/', function(req, res, next) {

    cmd.run(
        "helm ls -o json"
        , function( error, success, stderr ) {
            if( error ) {
                console.log( "ERROR 발생 :\n\n", error );
                var data = new Object() ;

                data.code = "error" ;

                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(data));
            } else {
                console.log( "SUCCESS :\n\n", success );
                var data = new Object() ;

                data.code = "success" ;
                data.message = success;

                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(data));
            }
        }
    );
});

/* GET home page. */
router.post('/helm/', function(req, res, next) {
    // helm repo 안 먹을 시
    // kubesphere에 repo info 등록
    // # helm repo add fems https://nexus.fems.cf/repository/fems

    // if checking version, packageName, namespace, factoryCode is null, and response error message
    if (req.body.version == null || req.body.packageName == null || req.body.namespace == null || req.body.factoryCode == null) {
        var data = new Object() ;

        data.code = "error" ;
        data.message = "empty values in version, packageName, namespace and factoryCode";

        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(data));
    }

    // if req.version and req.name is not null
    if (req.body.version && req.body.packageName && req.body.namespace && req.body.factoryCode) {
        const writeYamlFile = require('write-yaml-file')

        var value = {
            "namespace": req.body.namespace,
            "option": req.body.option
        };

        writeYamlFile('/data/fems/chart/value.yaml',value).then(() => {
            console.log('done');
        })

        var harborChartURL = 'oci://registry.fems.cf/fems/'+req.body.packageName+" --version "+req.body.version;
        var downloadPath = '/home/ubuntu/fems/fems-api-edge';
        var releaseName = req.body.packageName;
        var valuesFile = '/data/fems/chart/value.yaml';

        try{
            execSync(`helm pull ${harborChartURL} --untardir ${downloadPath}`);
            execSync(`helm install ${releaseName} ${downloadPath}/`+req.body.packageName+'-'+req.body.version+`.tgz -f ${valuesFile} --create-namespace -n ${req.body.namespace}`);

            var data = new Object();

            data.code = "deploy success";

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(data));
        } catch(error){
            var data = new Object();

            data.code = error.message;

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(data));
        }
    }
});

module.exports = router;
