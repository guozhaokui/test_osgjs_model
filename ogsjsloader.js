/// <reference path="typings/node/node.d.ts" />
'use strict';
var fs = require('fs');
var path = require('path');

const IMPLICIT_HEADER_PRIMITIVE_LENGTH = 0;
const IMPLICIT_HEADER_MASK_LENGTH = 1;
const IMPLICIT_HEADER_EXPECTED_INDEX = 2;
const IMPLICIT_HEADER_LENGTH = 3;
class OGSJSLoader{
    constructor(){
        this.filedesc = null;
        this.db = {};//name:ArrrayBuffer
    }

    /**
     * @param dbfile {string} 输入文件
     */
    load(dbfile){
        //var fb = fs.readFileSync(jsonfile,'utf8').toString();
        //var obj = JSON.parse(fb);
        //this.filedesc = obj;
        this.db = new Uint8Array( fs.readFileSync(dbfile));//把Node的Buffer转成Uint8ARray
    }

    /**
     * @param outfile {string} 输出文件 
     */
    testout(outfile){
        /*
        var root = this.filedesc['osg.Node'];
        var childs = root.Children;
        var childNum = childs.length;
        */
        //tristrip
        var geo1={
            primidx:[
                {id:18,off:0,sz:133464,mode:'TRIANGLE_STRIP',encode:'varint'},
                {id:19,off:210688,sz:11421,mode:'TRIANGLES',encode:'varint'}
            ],
            vertattr:{
                pos:{id:14,off:1242700,sz:65238,itemsz:3,encode:'varint'},
                norm:{id:15,off:230048,sz:65238,itemsz:2,encode:'varint'},
                tan:{id:17,off:475400,sz:65238,itemsz:2,encode:'varint'},
                tex0:{id:16,off:720796,sz:65238,itemsz:2,encode:'float32'}
            }
        };

        var dt = this.decodePrimIndex_varint(this.db,0,133464);
        debugger;
    }

    /**
     * 把varint描述的数据转换成uint32的
     * @param u8buff
     * @param offset {number}
     * @param sz {number}
     */
    varintToInt32(u8buff, offset, sz){
        var ret = new Uint32Array(sz);
        for(var s=offset,a=0; a!=sz;){
            var o=0,u=0;
            do{
                o |= (0x7f & u8buff[s])<<u;
                u+=7;
            }while(0!==(0x80 & u8buff[s++]));
            ret[a++]=o;
        }
        return ret;
    }

    /**
     * 恢复成delta表示的
     * @param t {Uint32Array}  
     * @param off {number}
     */
    undelta(t, off){
        //第一个是1， 第二个是0， 所以从 a=i+1 开始， 例如 1,0,0,0,0
        for (var i = off || 0, r = t.length, n = t[i], a = i + 1; r > a; ++a) {
            var s = t[a];
            n = t[a] = n + (s >> 1 ^ -(1 & s));
        }
        return t;
    }

    /**
     * @param t {Uint32Array}  解开后的原始数据
     * @param e {Uint16Array}  解码输出数据
     * @param r {number} 偏移。例如 472 =  o.IMPLICIT_HEADER_LENGTH + n[o.IMPLICIT_HEADER_MASK_LENGTH] = 3+469
     * @param n {Object} 没用先
     */
    decodeIdex(t, e, r, n){
        var a = t[IMPLICIT_HEADER_EXPECTED_INDEX];    //0
        var s = t[IMPLICIT_HEADER_MASK_LENGTH];       // 469
        var o = new Uint32Array(t.subarray(IMPLICIT_HEADER_LENGTH, s + IMPLICIT_HEADER_LENGTH));//o是去掉头和mask之后的
        var u = 32 * s - e.length;
        //mask次循环
        for (var l = 1 << 31, h = 0; s > h; ++h){
            //32次循环
            for (var c = o[h], d = 32, p = h * d, f = h === s - 1 ? u : 0, g = f; d > g; ++g,++p){
                c & l >>> g ? e[p] = t[r++] : e[p] = n ? a : a++;
            }
        }
        return e;
    }    

    dd(t, o, i) {
        for (var r = i[0], n = t.length, a = 0; n > a; ++a) {
            var s = r - t[a];
            o[a] = s,
            s >= r && (r = s + 1);
        }
        return i[0] = r,o;
    }    

    /**
     * @param buff {Uint8Array} 数据
     * @return {Uint16Array} 顶点索引
     */
    decodePrimIndex_varint(buff, offset, len){
        var u32dt = this.varintToInt32(buff,offset,len);
        var idxDtOff = IMPLICIT_HEADER_LENGTH+u32dt[IMPLICIT_HEADER_MASK_LENGTH];
        u32dt = this.undelta(u32dt, idxDtOff);
        var oo = new Uint16Array(u32dt[IMPLICIT_HEADER_PRIMITIVE_LENGTH]);//这里是有多少个index
        var d1 = this.decodeIdex(u32dt,oo,IMPLICIT_HEADER_LENGTH+u32dt[IMPLICIT_HEADER_MASK_LENGTH],2);
        this.dd(d1,d1,[0]);
        return d1;
    }

    test(){
    }
}



//exports.loader = OGSJSLoader;