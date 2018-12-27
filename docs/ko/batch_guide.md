# 제니퍼 서버 배치(백업)

제니퍼 서버 배치란 통계성 데이터를 특정 시간대에 일괄적으로 외부로 내보내기할 때, 사용되는 확장 기능이다. 제공되는 통계성 데이터는 Metrics와 Application Service이다. 오라클이나 MS-SQL과 같은 RDB에 통계성 데이터를 백업하거나 CSV 파일 형태로 내보내기 하는 등 다양한 형태로 응용할 수 있다.

### 버전 요구사항

본 문서는 제니퍼 서버 버전 5.4.0을 기준으로 작성되었다.


## IntelliJ에서 배치 개발환경 구성하기

5.4.0 버전부터는 제니퍼 뷰서버가 설치되어 있지 않아도 메이븐 디펜던시 하나만 추가하면 배치를 구현할 수 있게 되었다.

1. File > New > Project... > Maven을 선택하여, 새로운 프로젝트를 생성한다.
2. GroupId와 ArtifactId를 자신의 프로젝트에 맞게 넣어주고, Next 버튼을 클릭면 프로젝트가 생성된다.
3. src/main/java 디렉토리에 GroupId.ArtifactId 구조로 어댑터 클래스가 추가될 패키지를 생성하자.
4. com.aries.extension 라이브러리와 빌드 관련 메이븐 플러그인에 대한 설정 코드를 [pom.xml](https://github.com/jennifersoft/jennifer-view-batch-tutorial/blob/master/pom.xml)에 추가하자.
> 참고로 GroupdId는 플러그인과 달리 임의로 설정해도 상관없지만 com.aries를 사용할 것을 권장한다.


## 공통

#### preHandle 메소드

배치가 시작된 시간을 인자로 받으며, true를 리턴해야 process 메소드가 실행된다. 예를 들면 RDB에 저장되기 전에 테이블 스키마 생성시 사용된다.

#### process 메소드

어댑터와 달리 클래스가 아닌 인터페이스(BatchData) 배열을 인자로 받으며, 배치 데이터 유형에 맞게 형 변환(Casting)해서 사용해야 한다.

## Metrics 배치

DB 검색 분석 화면에서 조회할 수 있는 데이터를 배치 핸들러를 통해 전달된다.

#### Domain
```java
package com.aries.tutorial;

import com.aries.extension.data.BatchData;
import com.aries.extension.data.batch.MetricsDataAsDomain;
import com.aries.extension.handler.BatchHandler;
import com.aries.extension.util.PropertyUtil;

public class DomainMetricsBatch implements BatchHandler {
    @Override
    public boolean preHandle(long batchTime) {
        // TODO: Adding pre-processing code
        return true;
    }

    @Override
    public void process(BatchData[] batchData) {
        System.out.println("[DomainMetricsBatch] - " +
                PropertyUtil.getValue("domain_metrics_batch", "subject", "Unknown subject"));

        for(int i = 0; i < batchData.length; i++) {
            MetricsDataAsDomain data = (MetricsDataAsDomain) batchData[i];

            System.out.println("Domain ID : " + data.domainId);
            System.out.println("Domain Name : " + data.domainName);
            System.out.println("Call Count : " + data.serviceCount);
            System.out.println("Max TPS : " + data.maxTps);
            System.out.println("Active Service : " + data.activeService);
            System.out.println("Error Count : " + data.errorCount + "\n");
        }
    }
}
```

#### Instance
```java
MetricsDataAsInstance data = (MetricsDataAsInstance) batchData[i];
```

#### Business
```java
MetricsDataAsBusiness data = (MetricsDataAsBusiness) batchData[i];
```

## Application Service 배치

애플리케이션 현황 분석 화면에서 조회할 수 있는 데이터를 배치 핸들러를 통해 전달된다. 참고로 어댑터 및 실험실 관리 화면에서 설정을 통해 일일 또는 시간당 데이터로 분기해서 보낼 수 있다.

```java
package com.aries.tutorial;

import com.aries.extension.data.BatchData;
import com.aries.extension.data.batch.ApplicationServiceData;
import com.aries.extension.handler.BatchHandler;
import com.aries.extension.util.PropertyUtil;

public class ApplicationServiceBatch implements BatchHandler {
    @Override
    public boolean preHandle(long batchTime) {
        // TODO: Adding pre-processing code
        return true;
    }

    @Override
    public void process(BatchData[] batchData) {
        System.out.println("[ApplicationServiceBatch] - " +
                PropertyUtil.getValue("application_service_batch", "subject", "Unknown subject"));

        for(int i = 0; i < batchData.length; i++) {
            ApplicationServiceData data = (ApplicationServiceData) batchData[i];

            System.out.println("Domain ID : " + data.domainId);
            System.out.println("Domain Name : " + data.domainName);
            System.out.println("Instance Name : " + data.instanceName);
            System.out.println("Application Name : " + data.applicationName);
            System.out.println("Call Count : " + data.callCount);
            System.out.println("Failure Count : " + data.failureCount + "\n");
        }
    }
}
```

## 사용자 정의 옵션 사용하기

제니퍼 뷰서버의 관리 > 어댑터 및 실험실에서 직접 구현한 어댑터를 추가할 수 있는데, 이때 ID를 필수적으로 입력해야한다. 이 값은 어댑터 핸들러를 구현할 때, 사용자정의 옵션을 가져오기 위한 ID이다.
![이미지](../assets/img/adapter/custom_options1.png)

추가한 어댑터를 선택하면 사용자정의 옵션을 설정할 수 있는 버튼이 노출된다. 예전에는 별도로 properties 파일을 만들어서 옵션을 어댑터에서 직접 참조했었는데, 이제는 제니퍼 뷰서버 관리 화면을 통해 동적으로 추가/수정/삭제할 수 있다.
![이미지](../assets/img/adapter/custom_options2.png)

설정된 사용자정의 옵션들은 아래와 같이 어댑터 핸들러 구현시 사용할 수 있다. 첫번째 변수는 앞에서 어댑터를 추가할 때, 입력한 ID이며, 두번째 변수는 사용자정의 옵션키이다. 마지막 세번째 변수는 해당 키의 값이 없을 경우에 대신 추가되는 기본값이다.

## 뷰서버 옵션 사용하기

제니퍼 뷰서버의 server_view.conf 설정 파일에 정의된 옵션 값을 어댑터 내에서 사용할 수 있다. 첫번째 매개변수는 키 이름이고, 두번째는 값이 없을 때, 반환되는 기본 값이다.
```java
String db_path = com.aries.extension.util.ConfigUtil.getValue("db_path", "../db_view");
```