# scrapers/middlewares_custom.py

from scrapy.exceptions import IgnoreRequest

class CustomHttpErrorMiddleware:
    def process_response(self, request, response, spider):
        if response.status == 404:
            spider.logger.info("Note: Received 404 response; this is expected for unavailable listings. Ignoring this response.")
            raise IgnoreRequest("Ignoring 404 response")
        return response
