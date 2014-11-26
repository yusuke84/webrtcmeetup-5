/**
 * Created by yusuke on 2014/11/25.
 */

$(document).ready(function () {

    const APIKEY = '0e95b7fa-7431-11e4-93f6-3d047b5b6c93';
    const TURNSERVERHOST = '153.149.12.59:3478';
    const TURNUSERNAME = 'skyuser';
    const TURNPASS = 'skypass';

    var userList = new Array();

    var myPeerid = '';

    var myStream = null;

    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

    var peer = new Peer({key: APIKEY,
        config: { 'iceServers': [
            { 'url':'turn:'+TURNSERVERHOST,'username':TURNUSERNAME,'credential':TURNPASS }
        ] },
        debug: 3});

    peer.on('open', function(id) {
        myPeerid = id;
        console.log('My peer ID is: ' + id);

        _getUserMedia(function(stream){
            $('#myStream').prop('src', URL.createObjectURL(stream));
            $('#myStream').css('width','100%');

            myStream = stream;
            peer.on('call', function(call) {

                call.answer(stream);

                call.on('stream', function(stream){
                    _addVideoDom(call,stream);
                });

                _addUserList(call);

                call.on('close', function(){
                    _removeUserList(call);
                    _removeVideoDom(call);

                });
            });

            setInterval(_getUserlist, 1000);

        });

    });

    peer.on('error', function(err){
        console.log(err);
    });

    function _getUserMedia(callback) {
        navigator.getUserMedia({
            audio: true,
            video: {
                mandatory: {
                    maxWidth:200,
                    maxHeight:200
                },
                optional: [
                    {
                        maxFrameRate: 5
                    }]
            }

        }, function(stream){
            callback(stream);

        }, function(){
            console.log('getUserMedia error');

        });
    }

    function _getUserlist() {
        //ユーザリストを取得
        peer.listAllPeers(function(list){
            for(var cnt = 0;cnt < list.length;cnt++){
                var grepAns = $.grep(userList,function(n){
                    //検索条件を設定
                    return (n.peer == list[cnt]);
                });
                if(grepAns.length == 0 && myPeerid != list[cnt]){
                    var _call = peer.call(list[cnt],myStream);
                    _callEvent(_call);
                    _addUserList(_call);
                }
            }
        });
    }

    function _callEvent(call){
        call.on('stream', function(stream){
            _addVideoDom(call,stream);
        });

        call.on('close', function(){
            _removeUserList(call);
        });

    }

    function _addUserList(call){
        userList.push(call);

    }

    function _removeUserList(call){
        var _position = userList.indexOf(call);
        if(_position > 0){
            userList.splice(_position,1)
        }
        call.close();
        _removeVideoDom(call);

    }

    function _addVideoDom(call,stream){
        var _videoDom = $('<video>');
        _videoDom.attr('id',call.peer);
        _videoDom.prop('src',URL.createObjectURL(stream));
        _videoDom.prop('autoplay', true);
        _videoDom.addClass('video');

        $('.videosContainer').append(_videoDom);
        _resizeDom();

    }

    function _removeVideoDom(call){
        $('#'+call.peer).remove();
        _resizeDom();

    }

    function _resizeDom(){
        var _baseW = 100;
        var _baseH = 100;
        var _width = 100;
        var _height = 100;

        var _nodes = $('.videosContainer').children();

        var _width = _baseW / _nodes.length;
        var _height = _baseH / _nodes.length;

        for(var i=0; i < _nodes.length; i++){
            if(_width >= 25){
                $(_nodes[i]).css('width',_width+'%');
            }else{
                $(_nodes[i]).css('width','25%');
            }
        }

    }

});