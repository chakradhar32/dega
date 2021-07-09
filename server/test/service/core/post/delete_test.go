package post

import (
	"net/http"
	"net/http/httptest"
	"regexp"
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/factly/dega-server/service"
	"github.com/factly/dega-server/test"
	"github.com/factly/dega-server/test/service/core/category"
	"github.com/factly/dega-server/test/service/core/tag"
	"github.com/gavv/httpexpect/v2"
	"gopkg.in/h2non/gock.v1"
)

func TestPostDelete(t *testing.T) {
	mock := test.SetupMockDB()

	test.MockServer()
	defer gock.DisableNetworking()

	testServer := httptest.NewServer(service.RegisterRoutes())
	gock.New(testServer.URL).EnableNetworking().Persist()
	defer gock.DisableNetworking()
	defer testServer.Close()

	// create httpexpect instance
	e := httpexpect.New(t, testServer.URL)

	t.Run("invalid post id", func(t *testing.T) {
		test.CheckSpaceMock(mock)

		e.DELETE(path).
			WithPath("post_id", "invalid_id").
			WithHeaders(headers).
			Expect().
			Status(http.StatusBadRequest)

	})

	t.Run("post record not found", func(t *testing.T) {
		test.CheckSpaceMock(mock)
		recordNotFoundMock(mock)

		e.DELETE(path).
			WithPath("post_id", "100").
			WithHeaders(headers).
			Expect().
			Status(http.StatusNotFound)
	})

	t.Run("post record deleted", func(t *testing.T) {
		test.CheckSpaceMock(mock)
		postSelectWithSpace(mock)

		mock.ExpectQuery(regexp.QuoteMeta(`SELECT * FROM "post_categories"`)).
			WithArgs(1).
			WillReturnRows(sqlmock.NewRows([]string{"post_id", "category_id"}).
				AddRow(1, 1))
		category.SelectWithOutSpace(mock)

		mock.ExpectQuery(regexp.QuoteMeta(`SELECT * FROM "post_tags"`)).
			WithArgs(1).
			WillReturnRows(sqlmock.NewRows([]string{"post_id", "tag_id"}).
				AddRow(1, 1))
		tag.SelectMock(mock, tag.Data, 1)

		deleteMock(mock)
		mock.ExpectCommit()

		e.DELETE(path).
			WithPath("post_id", 1).
			WithHeaders(headers).
			Expect().
			Status(http.StatusOK)
	})

	t.Run("delete when meili is down", func(t *testing.T) {
		test.DisableMeiliGock(testServer.URL)
		test.CheckSpaceMock(mock)
		postSelectWithSpace(mock)
		mock.ExpectQuery(regexp.QuoteMeta(`SELECT * FROM "post_categories"`)).
			WithArgs(1).
			WillReturnRows(sqlmock.NewRows([]string{"post_id", "category_id"}).
				AddRow(1, 1))
		category.SelectWithOutSpace(mock)

		mock.ExpectQuery(regexp.QuoteMeta(`SELECT * FROM "post_tags"`)).
			WithArgs(1).
			WillReturnRows(sqlmock.NewRows([]string{"post_id", "tag_id"}).
				AddRow(1, 1))
		tag.SelectMock(mock, tag.Data, 1)

		deleteMock(mock)
		mock.ExpectRollback()

		e.DELETE(path).
			WithPath("post_id", 1).
			WithHeaders(headers).
			Expect().
			Status(http.StatusInternalServerError)
	})

}
