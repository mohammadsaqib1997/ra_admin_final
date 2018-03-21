<template lang="pug">
    div
        .row
            .col-md-3.col-md-offset-9
                .form-group
                    input.form-control(type='text' placeholder='Search' v-model='search_table')
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
      table: null,
      gen_pages: 0,
      curPage: 1,
      visible_rows: null,
      start: 0,
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

      let searches = val.split(";");

      if (searches[0] !== "") {
        $rows.addClass("hidden");
        $rows.each(function() {
          const $row = $(this);
          const columns = $row.find("td");
          let v_row = false;

          columns.each(function() {
            const $col = $(this);
            const attr_get = $col.attr("data-indx");
            searches.forEach(function(srh) {
              if (srh !== "") {
                let split_sval = srh.split(":");
                if (
                  typeof attr_get !== "undefined" &&
                  attr_get === split_sval[0]
                ) {
                  const col_ind_val = $col.attr("data-search");
                  if (
                    self.indexes[split_sval[0]].hasOwnProperty([split_sval[1]])
                  ) {
                    if (
                      self.indexes[split_sval[0]][split_sval[1]] == col_ind_val
                    ) {
                      v_row = self.multiCheck(searches, v_row);
                    }
                  }
                } else {
                  let txt = $col.text().toLowerCase();
                  let val = split_sval[0].toLowerCase();
                  if (txt.indexOf(val) > -1) {
                    v_row = self.multiCheck(searches, v_row);
                  }
                }
              }
            });
          });

          if (v_row) {
            $row.removeClass("hidden");
          }
        });
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
    multiCheck(searches, prev_col_val) {
      if (searches.length > 1) {
          console.log(searches, prev_col_val);
        if (prev_col_val) {
          return true;
        } else {
          return true;
        }
      } else {
        return true;
      }
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