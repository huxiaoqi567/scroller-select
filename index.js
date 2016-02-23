define(function(require, exports, module) {
    var XScroll = require('xscroll');
    var Util = require('util');
    var Base = require('base');
    var Snap = require('plugins/snap');
    var rem = function(n) {
        var baseRem = window.rem ? window.rem : window.getComputedStyle(document.documentElement).fontSize.replace('px', '');
        return n * baseRem;
    }

    function CitySelect(userConfig) {
        var self = this;
        if (!userConfig || !userConfig.renderTo) return;
        CitySelect.superclass.constructor.call(this);
        self.userConfig = Util.mix({
            targets: [],
            data: [],
            rootId: "1",
            levels: 3,
            // defaultFocus: ,  //默认聚焦
            itemHeight: rem(1)
        }, userConfig);
        self.init();
    }


    Util.extend(CitySelect, Base, {
        rem: rem,
        selected: [],
        init: function() {
            var self = this;
            var $renderTo = self.$renderTo = $(self.userConfig.renderTo);
            self.data = self.userConfig.data;
        },
        focus: function(grade, val) {
            var self = this;
            var sel = self.getById(val),
                pid = sel[1];
            self.renderScrollerForward(grade, self.getByPid(pid), val);
        },
        getById: function(id) {
            return this.data[id];
        },
        getByPid: function(parentId) {
            var temp = new Array();
            $.each(this.data, function(key, val) {
                if (parentId == val[1]) {
                    temp.push([key, val[0], val[1]]);
                }
            });
            return temp;
        },
        renderScrollerForward: function(level, data, val) {
            var self = this;
            self.renderScroller(level, data, val);
            if (level < self.userConfig.levels - 1) {
                self.renderScrollerForward(level + 1, self.getByPid(self.selected[level]));
            }
        },
        renderScroller: function(level, data, val) {
            var self = this;
            var itemHeight = self.userConfig.itemHeight;
            if (self.xscrolls[level]) {
                var html = '<ul>';
                for (var i in data) {
                    html += '<li data-id="' + data[i][0] + '">' + data[i][1] + '</li>';
                }
                html += '</ul>';
                $(self.xscrolls[level].content).html(html);
                var snap = self.xscrolls[level].getPlugin('snap');
                snap.userConfig.snapRowsNum = data.length;
                snap.userConfig.snapHeight = itemHeight;
                snap.snapRowIndex = undefined;
            }

            self.xscrolls[level].render();
            $(self.xscrolls[level].renderTo).css({
                overflow: "visible"
            });
            var valIndex = val ? self.getValIndex(data, val) : 0;
            if (valIndex >= 0) {
                self.xscrolls[level].scrollTop(itemHeight * valIndex)
                self.selected[level] = val || (data[0] ? Number(data[0][0]) : undefined);
            }
        },
        getValIndex: function(data, val) {
            if (!data) return;
            for (var i in data) {
                if (data[i][0] == val) {
                    return +i;
                }
            }
        },
        _bindEvt: function() {
            var self = this;
            if (self._isBind) return;
            self._isBind = true;
            self.xscrolls.forEach(function(xscroll, i) {
                xscroll.on("tap", function(e) {
                    console.log(e.target)
                })
                var snap = xscroll.getPlugin('snap');
                snap.on("rowchange", function(e) {
                    var level = Number(i);
                    var rowIndex = e.curRowIndex;
                    var pid = self.selected[i - 1] || 1;
                    var datas = self.getByPid(pid);
                    var data = datas[rowIndex];
                    var val = Number(data[0]);
                    self.renderScrollerForward(level, self.getByPid(pid), val);
                    self.trigger('change', {
                        index: rowIndex,
                        level: level,
                        pid: pid,
                        data: data,
                        datas: datas
                    })
                }, xscroll)
            });
        },
        render: function() {
            var self = this,
                userConfig = self.userConfig,
                levels = userConfig.levels,
                defaultFocus = userConfig.defaultFocus;

            if (!self.xscrolls) {
                self.xscrolls = [];
            }
            for (var i = 0; i < levels; i++) {
                if (!self.xscrolls[i]) {
                    var xscroll = self.xscrolls[i] = new XScroll({
                        bounce: false,
                        renderTo: self.$renderTo.find(".select-scroller").eq(i)[0],
                        lockY: false,
                        lockX: true,
                        scrollbarY: false,
                        scrollbarX: false
                    });
                    xscroll.plug(new Snap({
                        autoStep: true
                    }));
                    xscroll.render();
                }
            };
            if (defaultFocus) {
                self.focus(0, defaultFocus);
            }
            self._bindEvt();
        },
        getVal: function() {
            var self = this;
            var selected = self.selected;
            var vals = [];
            selected.forEach(function(id, i) {
                vals.push(self.getById(id));
            });
            return vals;
        }
    });
    module.exports = CitySelect;
});