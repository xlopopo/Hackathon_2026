from fastapi.responses import StreamingResponse
import io


def create_docx_response(buffer: io.BytesIO, filename: str) -> StreamingResponse:
    """Создание HTTP-ответа с DOCX-файлом."""
    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


def create_html_response(html_content: str) -> StreamingResponse:
    """Создание HTTP-ответа с HTML."""
    return StreamingResponse(
        io.BytesIO(html_content.encode("utf-8")),
        media_type="text/html; charset=utf-8",
    )