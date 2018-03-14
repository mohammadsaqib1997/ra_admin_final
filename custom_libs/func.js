module.exports  = {
    decode_key: function (id) {
        var PUSH_CHARS= "-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz";
        id = id.substring(0,8);
        var timestamp = 0;
        for (var i=0; i < id.length; i++) {
            var c = id.charAt(i);
            timestamp = timestamp * 64 + PUSH_CHARS.indexOf(c);
        }
        return timestamp;
    },
    set_date_ser: function (date) {
        var h_obj = this.get_12_hours(date.getHours());
        return h_obj.hour+":"+("0"+date.getMinutes()).slice(-2)+" "+h_obj.ap+" "+("0"+date.getDate()).slice(-2)+"/"+("0"+(date.getMonth()+1)).slice(-2)+"/"+date.getFullYear();
    },
    get_12_hours: function(hours){
        var ap = ['AM', 'PM'];
        return { hour: ("0" + (hours % 12)).slice(-2), ap: ap[Math.floor(hours/12)] }
    },
    setDateInvoice: function (date) {
        return date.getFullYear()+""+("0"+(date.getMonth()+1)).slice(-2)+""+("0"+date.getDate()).slice(-2)
    },
    sortObj: function sortObject(o, rev) {
        rev = (typeof rev !== 'undefined') ? rev: true;
        var sorted = {},
            key, a = Object.keys(o);
        if(rev){
            a.sort().reverse();
        }else{
            a.sort();
        }
        for (key = 0; key < a.length; key++) {
            sorted[a[key]] = o[a[key]];
        }
        return sorted;
    },
    sortObjByVal: function sortObject(o, s_key, rev) {
        rev = (typeof rev !== 'undefined') ? rev: false;
        var sorted = {},
            key, a = Object.keys(o).sort(function (a, b) {
                return o[a][s_key] - o[b][s_key];
            });
        if(rev){
            a.reverse();
        }
        for (key = 0; key < a.length; key++) {
            sorted[a[key]] = o[a[key]];
        }
        return sorted;
    },
    genInvoiceNo: function (num) {
        num = num.toString();
        if(num.length < 3){
            num = ('00'+num).slice(-3);
        }
        return num;
    },
    getSetInvoiceNo: function (key, invoice_no, char) {
        return this.setDateInvoice(new Date(this.decode_key(key)))+char+invoice_no;
    },
    getPercentAmount: function (amount, per) {
        return (amount*per)/100;
    },
    getBalance: function (oldBal, debit, credit) {
        return (debit-credit)+oldBal;
    },
    tableSearch: function(el_table, search_val){
        let table = $(el_table);
        let body = table.find('tbody');
        let rows = body.find('tr');
        if(search_val !== ""){
            rows.addClass('hidden');
        }else{
            rows.removeClass('hidden');
        }
        rows.each(function () {
            let tr = $(this);
            let columns = tr.find('td');
            columns.each(function () {
                let td = $(this);
                let txt = td.text().toLowerCase();
                search_val = search_val.toLowerCase();
                if(txt.indexOf(search_val) > -1){
                    td.parent().removeClass('hidden');
                }
            });
        });
    },
    toTitleCase(str) {
        return str.replace(/\w\S*/g, function (txt) {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        });
    }
};