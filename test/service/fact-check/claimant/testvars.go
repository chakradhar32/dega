package claimant

import (
	"fmt"
	"regexp"
	"time"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/factly/dega-server/test"
	"github.com/factly/dega-server/test/service/core/medium"
	"github.com/jinzhu/gorm/dialects/postgres"
)

var headers = map[string]string{
	"X-Space": "1",
	"X-User":  "1",
}

var Data = map[string]interface{}{
	"name": "TOI",
	"slug": "toi",
	"description": postgres.Jsonb{
		RawMessage: []byte(`{"time":1617039625490,"blocks":[{"type":"paragraph","data":{"text":"Test Description"}}],"version":"2.19.0"}`),
	},
	"html_description": "<p>Test Description</p>",
	"tag_line":         "sample tag line",
	"medium_id":        uint(1),
}

var resData = map[string]interface{}{
	"name": "TOI",
	"slug": "toi",
	"description": postgres.Jsonb{
		RawMessage: []byte(`{"time":1617039625490,"blocks":[{"type":"paragraph","data":{"text":"Test Description"}}],"version":"2.19.0"}`),
	},
	"html_description": "<p>Test Description</p>",
	"tag_line":         "sample tag line",
}

var invalidData = map[string]interface{}{
	"name": "a",
}

var columns = []string{"id", "created_at", "updated_at", "deleted_at", "created_by_id", "updated_by_id", "name", "slug", "medium_id", "description", "html_description", "tag_line", "space_id"}

var selectQuery = regexp.QuoteMeta(`SELECT * FROM "claimants"`)
var deleteQuery = regexp.QuoteMeta(`UPDATE "claimants" SET "deleted_at"=`)
var paginationQuery = `SELECT \* FROM "claimants" (.+) LIMIT 1 OFFSET 1`

var basePath = "/fact-check/claimants"
var path = "/fact-check/claimants/{claimant_id}"

func slugCheckMock(mock sqlmock.Sqlmock, claimant map[string]interface{}) {
	mock.ExpectQuery(regexp.QuoteMeta(`SELECT slug, space_id FROM "claimants"`)).
		WithArgs(fmt.Sprint(claimant["slug"], "%"), 1).
		WillReturnRows(sqlmock.NewRows(columns))
}

func claimantInsertMock(mock sqlmock.Sqlmock) {
	mock.ExpectBegin()
	medium.SelectWithSpace(mock)
	mock.ExpectQuery(`INSERT INTO "claimants"`).
		WithArgs(test.AnyTime{}, test.AnyTime{}, nil, 1, 1, Data["name"], Data["slug"], Data["description"], Data["html_description"], Data["tag_line"], Data["medium_id"], 1).
		WillReturnRows(sqlmock.
			NewRows([]string{"id", "medium_id"}).
			AddRow(1, 1))
}

func claimantInsertError(mock sqlmock.Sqlmock) {
	mock.ExpectBegin()
	medium.EmptyRowMock(mock)
	mock.ExpectRollback()
}

func claimantUpdateMock(mock sqlmock.Sqlmock, claimant map[string]interface{}, err error) {
	mock.ExpectBegin()
	if err != nil {
		medium.EmptyRowMock(mock)
	} else {
		medium.SelectWithSpace(mock)
		mock.ExpectExec(`UPDATE \"claimants\"`).
			WithArgs(test.AnyTime{}, 1, claimant["name"], claimant["slug"], claimant["description"], claimant["html_description"], claimant["tag_line"], claimant["medium_id"], 1).
			WillReturnResult(sqlmock.NewResult(1, 1))
		SelectWithSpace(mock)
		medium.SelectWithOutSpace(mock)
	}

}

func SelectWithOutSpace(mock sqlmock.Sqlmock, claimant map[string]interface{}) {
	mock.ExpectQuery(selectQuery).
		WithArgs(1).
		WillReturnRows(sqlmock.NewRows(columns).
			AddRow(1, time.Now(), time.Now(), nil, 1, 1, claimant["name"], claimant["slug"], claimant["medium_id"], claimant["description"], claimant["html_description"], claimant["tag_line"], 1))

	// Preload medium
	medium.SelectWithOutSpace(mock)
}

func SelectWithSpace(mock sqlmock.Sqlmock) {
	mock.ExpectQuery(selectQuery).
		WithArgs(1, 1).
		WillReturnRows(sqlmock.NewRows(columns).
			AddRow(1, time.Now(), time.Now(), nil, 1, 1, Data["name"], Data["slug"], Data["medium_id"], Data["description"], Data["html_description"], Data["tag_line"], 1))
}

//check claimant exits or not
func recordNotFoundMock(mock sqlmock.Sqlmock) {
	mock.ExpectQuery(selectQuery).
		WithArgs(1, 100).
		WillReturnRows(sqlmock.NewRows(columns))
}

// check claimant associated with any claim before deleting
func claimantClaimExpect(mock sqlmock.Sqlmock, count int) {
	mock.ExpectQuery(regexp.QuoteMeta(`SELECT count(*) FROM "claims"`)).
		WithArgs(1).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(count))
}

func claimantCountQuery(mock sqlmock.Sqlmock, count int) {
	mock.ExpectQuery(regexp.QuoteMeta(`SELECT count(*) FROM "claimants"`)).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(count))
}

func EmptyRowMock(mock sqlmock.Sqlmock) {
	mock.ExpectQuery(selectQuery).
		WithArgs(1, 1).
		WillReturnRows(sqlmock.NewRows(columns))
}
