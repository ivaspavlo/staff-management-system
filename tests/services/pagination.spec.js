const { chai } = require('../../services').setupTest;
const { expect } = chai;
const { pagination } = require('../../services');

describe('Services Pagination', () => {

    describe('Test pagination', () => {
        const defaultPagination = {
            'currentPage': 0,
            'firstPage': 1,
            'fistResult': 0,
            'hasNextPage': false,
            'hasPreviousPage': false,
            'lastPage': 0,
            'lastResult': 0,
            'nextPage': 1,
            'pages': 0,
            'previousPage': -1,
            'results': 0,
            'totalPages': 0,
            'totalResults': 0
        };


        it('should return empty pagination for default parameters', () => {
            const result = pagination();

            expect(result).to.deep.equal(defaultPagination);
        });

        it('should return valid pagination for specific parameters', () => {
            const result = pagination(100, 3, 10);

            expect(result).to.deep.equal({
                'currentPage': 3,
                'firstPage': 1,
                'fistResult': 20,
                'hasNextPage': true,
                'hasPreviousPage': true,
                'lastPage': 10,
                'lastResult': 29,
                'nextPage': 4,
                'pages': 10,
                'previousPage': 2,
                'results': 10,
                'totalPages': 10,
                'totalResults': 100
            });
        });
    });

});
