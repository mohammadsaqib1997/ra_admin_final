<template lang="pug">
    div
      .row
        .col-md-3.col-md-offset-9
            .form-group
              input.form-control(type='text' placeholder='Search' v-model='search_table')
            .form-group
              label(style="margin-right:15px;")
                input.cusCheckBox(type='radio' v-model="r_radio_btn" value="or")
                | &nbsp;&nbsp;OR
              label
                input.cusCheckBox(type='radio' v-model="r_radio_btn" value="and")
                | &nbsp;&nbsp;AND
                  
      table.table.table-hover.table-click(ref='table')
          thead
              slot(name="thead")
          tbody
              slot(name="tbody")
          slot(name="tfoot")
      .row
          .col-sm-12.text-center.mt-15
              label.mr-10 Page: {{curPage}}/{{ gen_pages }}
              .btn-group
                  button.btn.btn-sm(v-if='curPage>1' v-on:click='prevPage')
                      i.fa.fa-chevron-left
                  button.btn.btn-sm(v-else disabled='disabled')
                      i.fa.fa-chevron-left
                  button.btn.btn-sm(v-if='curPage<gen_pages' v-on:click='nextPage')
                      i.fa.fa-chevron-right
                  button.btn.btn-sm(v-else disabled='disabled')
                      i.fa.fa-chevron-right
</template>

<script>
import _ from "lodash";
export default {
  name: "tabel_comp",
  props: {
    per_page: {
      type: Number,
      default: 10
    }
  },
  mounted() {
    const self = this;
    self.table = self.$refs.table;
    self.search_row("");

    $(function() {
      $("body").on("click", ".open_row", function() {
        let grabLink = $(this).attr("data-url");
        if (grabLink !== "") {
          self.$router.push(grabLink);
        }
      });
    });
  },
  watch: {
    r_radio_btn (val) {
      this.s_restrict = (val === "or") ? false:true;
    },
    s_restrict (val) {
      this.search_row(this.search_table);
    },
    search_table(val) {
      this.search_row(val);
    },
    curPage(val) {
      this.start = val * this.per_page - this.per_page;
      this.changePage();
    }
  },
  data() {
    return {
      search_table: "",
      r_radio_btn: "and",
      table: null,
      gen_pages: 0,
      curPage: 1,
      visible_rows: null,
      start: 0,
      s_restrict: true,
      indexes: {
        status: {
          activate: 1,
          deactivate: 0
        }
      }
    };
  },
  methods: {
    search_row(val) {
      const self = this;
      const $table = $(self.table);
      const $rows = $table.find("tbody tr");

      let searches = _.filter(val.split(";"), function(srh) {
        if (srh !== "") {
          return srh;
        }
      });

      if (searches.length > 0 && searches[0] !== "") {
        let v_rows = {};
        $rows.addClass("hidden");
        $rows.each(function(row_ind) {
          const $row = $(this);
          const columns = $row.find("td");
          let validate_col = {};

          columns.each(function(col_ind) {
            validate_col[col_ind] = {};
            const $col = $(this);
            const attr_get = $col.attr("data-indx");
            searches.forEach(function(srh, s_ind) {
              if (srh !== "") {
                let split_sval = srh.split(":");
                if (
                  typeof attr_get !== "undefined" &&
                  attr_get === split_sval[0]
                ) {
                  const col_ind_val = $col.attr("data-search");
                  if (
                    self.indexes.hasOwnProperty(split_sval[0]) &&
                    self.indexes[split_sval[0]].hasOwnProperty([split_sval[1]])
                  ) {
                    if (
                      self.indexes[split_sval[0]][split_sval[1]] == col_ind_val
                    ) {
                      validate_col[col_ind][s_ind] = true;
                    }
                  } else if (split_sval[1] === col_ind_val) {
                    validate_col[col_ind][s_ind] = true;
                  }
                } else {
                  let txt = $col.text().toLowerCase();
                  let s_val = split_sval[0].toLowerCase();
                  if (txt.indexOf(s_val) > -1) {
                    validate_col[col_ind][s_ind] = true;
                  }
                }
              }
            });
          });

          v_rows[row_ind] = self.multiCheck(searches, validate_col);
        });

        row_loop: for (let [key, val] of Object.entries(v_rows)) {
          let find_s_row = {};
          columns: for (let [c_key, c_val] of Object.entries(val.valid_col)) {
            if (self.s_restrict) {
              for (let s_ind in c_val) {
                find_s_row[s_ind] = true;
                if (val.srh_length === Object.keys(find_s_row).length) {
                  $rows.eq(key).removeClass("hidden");
                  continue row_loop;
                }
              }
            } else {
              if (!_.isEmpty(c_val)) {
                $rows.eq(key).removeClass("hidden");
                break columns;
              }
            }
          }
        }
      } else {
        $rows.removeClass("hidden");
      }
      self.pagination_create($rows.not(".hidden"));
    },
    pagination_create(rows) {
      const self = this;
      const tot_v_r = rows.length;
      self.visible_rows = rows;
      self.gen_pages = Math.ceil(tot_v_r / self.per_page);
      self.gen_pages = self.gen_pages > 0 ? self.gen_pages : 1;
      self.curPage = 1;
      let end = Math.min(self.start + self.per_page, self.visible_rows.length);

      if (tot_v_r > 0) {
        rows.addClass("pag_hidden");
        for (let i = 0; i < end; i++) {
          rows.eq(i).removeClass("pag_hidden");
        }
      }
    },
    changePage() {
      const self = this;
      if (self.visible_rows.length > 0) {
        self.visible_rows.addClass("pag_hidden");
        let end = Math.min(
          self.start + self.per_page,
          self.visible_rows.length
        );
        for (let i = self.start; i < end; i++) {
          self.visible_rows.eq(i).removeClass("pag_hidden");
        }
      }
    },
    prevPage() {
      this.curPage -= 1;
    },
    nextPage() {
      this.curPage += 1;
    },
    multiCheck(searches, validate_col) {
      return { srh_length: searches.length, valid_col: validate_col };
    }
  }
};
</script>

<style scoped>
.mt-15 {
  margin-top: 15px;
}
.mr-10 {
  margin-right: 10px;
}
.pag_hidden {
  display: none;
}
</style>